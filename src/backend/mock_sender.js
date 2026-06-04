import dgram from 'node:dgram';
import { encode } from '@msgpack/msgpack';
import dotenv from 'dotenv';

dotenv.config();

const UDP_PORT = process.env.UDP_PORT ? parseInt(process.env.UDP_PORT, 10) : 41234;
const UDP_HOST = process.env.UDP_HOST || '127.0.0.1';
const SEND_INTERVAL_MS = 150; // 150ms entre amostras — fluído no Grafana

const client = dgram.createSocket('udp4');

// ─── Utilitários ────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function noise(amp) { return (Math.random() * 2 - 1) * amp; }

// ─── Gerador de waypoints para a corrida 1 ──────────────────────
// Rota: (0,0)->(4,0)->(4,3)->(7,3)->(7,7)  — 4 segmentos em L
function generateRun1Waypoints() {
  const wp = [];
  // Segmento 1: X de 0→4, Y=0, indo para LESTE
  for (let x = 0; x <= 4; x++) wp.push({ x, y: 0, dir: 'LESTE' });
  // Segmento 2: Y de 0→3, X=4, indo para NORTE
  for (let y = 1; y <= 3; y++) wp.push({ x: 4, y, dir: 'NORTE' });
  // Segmento 3: X de 4→7, Y=3, indo para LESTE
  for (let x = 5; x <= 7; x++) wp.push({ x, y: 3, dir: 'LESTE' });
  // Segmento 4: Y de 3→7, X=7, indo para NORTE
  for (let y = 4; y <= 7; y++) wp.push({ x: 7, y, dir: 'NORTE' });
  return wp;
}

// ─── Gerador de waypoints para a corrida 3 (fast run) ───────────
// Rota direta: (0,0)->(7,0)->(7,7) — 2 segmentos longos
function generateRun3Waypoints() {
  const wp = [];
  // Segmento 1: X de 0→7, Y=0, LESTE
  for (let x = 0; x <= 7; x++) wp.push({ x, y: 0, dir: 'LESTE' });
  // Segmento 2: Y de 0→7, X=7, NORTE
  for (let y = 1; y <= 7; y++) wp.push({ x: 7, y, dir: 'NORTE' });
  return wp;
}

// ─── Sensores ToF coerentes com a orientação ─────────────────────
// O robô se move dentro de um grid 16x16. As paredes do corredor
// ficam a ~180mm. Quando se aproxima de uma parede à frente,
// dist_frontal cai. Ao girar, a parede frontal vira lateral.
function computeSensors(posX, posY, dir, distToNextWall) {
  const WALL_FAR = 180;   // corredor aberto (mm)
  const WALL_CLOSE = 20;  // parede muito próxima (mm)

  let frontal, esq, dir_dist;

  if (distToNextWall <= 0) {
    // Encostado na parede — célula final de um segmento
    frontal = WALL_CLOSE;
  } else if (distToNextWall >= 4) {
    // Corredor longo à frente
    frontal = WALL_FAR;
  } else {
    // Aproximando: interpola de 180→20 conforme distância ao wall
    frontal = lerp(WALL_FAR, WALL_CLOSE, 1 - (distToNextWall / 4));
  }

  // Paredes laterais: sempre presentes no corredor (exceto becos sem saída)
  const lateralBase = 85;
  esq = lateralBase + Math.round(noise(5));
  dir_dist = lateralBase + Math.round(noise(5));

  // Se acabamos de virar e a parede frontal antiga agora é lateral
  // (sinalizado por distToNextWall === 0, i.e. estamos na célula de curva)
  if (distToNextWall <= 0) {
    // A parede que estava à frente agora está ao lado
    // Dependendo da direção de curva, ela fica à esquerda ou direita
    // Simplificação: ao virar à esquerda, a parede vai para a esquerda
    esq = WALL_CLOSE + Math.round(noise(3));
    frontal = WALL_FAR; // Novo corredor aberto à frente após a curva
  }

  // Ruído de sensor ToF (±3mm)
  frontal = clamp(Math.round(frontal + noise(3)), 10, 255);
  esq = clamp(Math.round(esq + noise(3)), 10, 255);
  dir_dist = clamp(Math.round(dir_dist + noise(3)), 10, 255);

  return { dist_frontal: frontal, dist_esq: esq, dist_dir: dir_dist };
}

// ─── Definição das 3 corridas ────────────────────────────────────

// Cada corrida é um gerador assíncrono que yields os frames de telemetria.
// Isso permite pausas entre corridas e controle fino do tempo.

function* runTest01Sucesso() {
  const waypoints = generateRun1Waypoints();
  const totalSteps = waypoints.length;
  // Índices das células de curva (onde muda de direção)
  const turnIndices = [];
  for (let i = 1; i < waypoints.length; i++) {
    if (waypoints[i].dir !== waypoints[i - 1].dir) {
      turnIndices.push(i);
    }
  }

  let step = 0;
  for (const wp of waypoints) {
    const progress = step / (totalSteps - 1); // 0..1

    // Bateria: 8.4V → 7.8V, decaimento linear suave
    const bateria = lerp(8.4, 7.8, progress);

    // Detecta se estamos em uma curva (este passo ou anterior)
    const isTurnCell = turnIndices.includes(step);
    const isApproachingTurn = turnIndices.includes(step + 1);

    // Velocidade: acelera nas retas, desacelera nas curvas
    let velocidadeMedia;
    if (isTurnCell) {
      velocidadeMedia = 0.10 + noise(0.02);
    } else if (isApproachingTurn) {
      velocidadeMedia = lerp(0.5, 0.1, 0.6) + noise(0.02);
    } else {
      velocidadeMedia = 0.50 + noise(0.02);
    }

    // PID: nas retas oscila levemente, nas curvas dá pico alto e converge
    let erroPid;
    if (isTurnCell) {
      // Pico alto no momento da curva
      erroPid = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.4);
    } else {
      // Verifica se a curva foi há 1 passo (convergindo)
      const prevTurn = turnIndices.find(ti => ti === step - 1);
      if (prevTurn !== undefined) {
        erroPid = noise(0.15); // convergindo rápido
      } else {
        erroPid = noise(0.03); // ruído leve nas retas
      }
    }

    // Distância até a próxima parede (em células) para o sensor frontal
    let distToNextWall = 4; // padrão: corredor aberto
    for (const ti of turnIndices) {
      if (ti > step) {
        distToNextWall = ti - step;
        break;
      }
      if (ti === step) {
        distToNextWall = 0; // na curva
        break;
      }
    }
    // Se não há mais curvas à frente, corredor aberto
    if (step > (turnIndices[turnIndices.length - 1] || 0)) {
      distToNextWall = 4;
    }

    const sensors = computeSensors(wp.x, wp.y, wp.dir, distToNextWall);

    // Estado do robô
    let estado;
    if (step === 0) estado = 'CALIBRATING';
    else if (step === totalSteps - 1) estado = 'GOAL_REACHED';
    else estado = 'MAPPING';

    yield {
      estado_fsm: estado,
      bateria_v: Math.round(bateria * 100) / 100,
      posicao_x: wp.x,
      posicao_y: wp.y,
      orientacao: wp.dir,
      erro_pid: Math.round(erroPid * 1000) / 1000,
      velocidade_media: Math.round(velocidadeMedia * 1000) / 1000,
      ...sensors,
    };

    step++;
  }
}

function* runTest02FalhaBateria() {
  const waypoints = [
    { x: 0, y: 0, dir: 'LESTE' },
    { x: 1, y: 0, dir: 'LESTE' },
    { x: 2, y: 0, dir: 'NORTE' },  // curva
    { x: 2, y: 1, dir: 'NORTE' },
    { x: 2, y: 2, dir: 'NORTE' },  // aqui a bateria falha
  ];
  const totalSteps = waypoints.length;
  const failureStep = 3; // índice do passo onde a bateria cai abruptamente
  const stepsAfterFailure = 5; // alguns frames de "apagão" antes de parar

  let step = 0;
  let postFailureCount = 0;

  // Fase normal (até o failureStep)
  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i];
    const progress = i / (totalSteps - 1);

    if (i < failureStep) {
      // Bateria: 7.4V com decaimento suave
      const bateria = lerp(7.4, 7.2, progress);
      const isTurn = i === 2; // curva em (2,0)
      const velocidadeMedia = isTurn ? 0.12 + noise(0.02) : 0.40 + noise(0.03);
      const erroPid = isTurn ? (Math.random() > 0.5 ? 1 : -1) * 0.7 : noise(0.04);

      const sensors = computeSensors(wp.x, wp.y, wp.dir, isTurn ? 0 : 3);

      yield {
        estado_fsm: i === 0 ? 'CALIBRATING' : 'MAPPING',
        bateria_v: Math.round(bateria * 100) / 100,
        posicao_x: wp.x,
        posicao_y: wp.y,
        orientacao: wp.dir,
        erro_pid: Math.round(erroPid * 1000) / 1000,
        velocidade_media: Math.round(velocidadeMedia * 1000) / 1000,
        ...sensors,
      };
      step++;

    } else if (i === failureStep) {
      // ── QUEDA ABRUPTA DE BATERIA ──
      // Bateria cai de ~7.1V para <5.5V
      yield {
        estado_fsm: 'ERROR',
        bateria_v: 5.40,
        posicao_x: wp.x,
        posicao_y: wp.y,
        orientacao: wp.dir,
        erro_pid: 0.85,  // trava em valor alto
        velocidade_media: 0.0,
        dist_frontal: 130,
        dist_esq: 85,
        dist_dir: 82,
      };
      step++;

    } else {
      // Não deveria chegar aqui nos waypoints normais
      break;
    }
  }

  // Fase de "apagão": robô está morto, valores estáticos
  const lastWp = waypoints[failureStep];
  for (let i = 0; i < stepsAfterFailure; i++) {
    yield {
      estado_fsm: 'ERROR',
      bateria_v: Math.round(lerp(5.4, 5.0, i / stepsAfterFailure) * 100) / 100,
      posicao_x: lastWp.x,
      posicao_y: lastWp.y,
      orientacao: lastWp.dir,
      erro_pid: 0.85,  // travado
      velocidade_media: 0.0,
      dist_frontal: 130,
      dist_esq: 85,
      dist_dir: 82,
    };
  }
}

function* runTest03FastRun() {
  const waypoints = generateRun3Waypoints();
  const totalSteps = waypoints.length;
  const turnIndices = [];
  for (let i = 1; i < waypoints.length; i++) {
    if (waypoints[i].dir !== waypoints[i - 1].dir) {
      turnIndices.push(i);
    }
  }

  let step = 0;
  for (const wp of waypoints) {
    const progress = step / (totalSteps - 1);

    // Bateria: 8.2V → 7.4V (consumo ligeiramente maior)
    const bateria = lerp(8.2, 7.4, progress);

    const isTurnCell = turnIndices.includes(step);
    const isApproachingTurn = turnIndices.includes(step + 1);

    // Velocidade alta e estável (mapa conhecido)
    let velocidadeMedia;
    if (isTurnCell) {
      velocidadeMedia = 0.30 + noise(0.01); // nem para tanto na curva
    } else if (isApproachingTurn) {
      velocidadeMedia = lerp(0.80, 0.30, 0.5) + noise(0.01);
    } else {
      velocidadeMedia = 0.80 + noise(0.01);
    }

    // PID extremamente estável — controle calibrado
    let erroPid;
    if (isTurnCell) {
      erroPid = (Math.random() > 0.5 ? 1 : -1) * (0.15 + Math.random() * 0.1);
    } else {
      const prevTurn = turnIndices.find(ti => ti === step - 1);
      if (prevTurn !== undefined) {
        erroPid = noise(0.03);
      } else {
        erroPid = noise(0.008); // muito estável
      }
    }

    let distToNextWall = 4;
    for (const ti of turnIndices) {
      if (ti > step) {
        distToNextWall = ti - step;
        break;
      }
      if (ti === step) {
        distToNextWall = 0;
        break;
      }
    }
    if (step > (turnIndices[turnIndices.length - 1] || 0)) {
      distToNextWall = 4;
    }

    const sensors = computeSensors(wp.x, wp.y, wp.dir, distToNextWall);

    let estado;
    if (step === 0) estado = 'FAST_RUN';
    else if (step === totalSteps - 1) estado = 'GOAL_REACHED';
    else estado = 'FAST_RUN';

    yield {
      estado_fsm: estado,
      bateria_v: Math.round(bateria * 100) / 100,
      posicao_x: wp.x,
      posicao_y: wp.y,
      orientacao: wp.dir,
      erro_pid: Math.round(erroPid * 1000) / 1000,
      velocidade_media: Math.round(velocidadeMedia * 1000) / 1000,
      ...sensors,
    };

    step++;
  }
}

// ─── Orquestrador das corridas ───────────────────────────────────
const runs = [
  { id_corrida: 'run_test_01_sucesso',      id_labirinto: '16x16_standard', generator: runTest01Sucesso },
  { id_corrida: 'run_test_02_falha_bateria', id_labirinto: '16x16_standard', generator: runTest02FalhaBateria },
  { id_corrida: 'run_test_03_fast_run',      id_labirinto: '16x16_standard', generator: runTest03FastRun },
];

let activeRunIndex = 0;
let currentGen = null;
let intervalHandle = null;
const PAUSE_BETWEEN_RUNS_MS = 2000;

function startRun(index) {
  const run = runs[index];
  currentGen = run.generator();
  console.log(`\n═══ INICIANDO CORRIDA: ${run.id_corrida} ═══`);

  intervalHandle = setInterval(() => {
    const result = currentGen.next();

    if (result.done) {
      // Corrida terminou — limpa timer e inicia a próxima após pausa
      clearInterval(intervalHandle);
      intervalHandle = null;
      console.log(`═══ FIM DA CORRIDA: ${run.id_corrida} ═══`);

      activeRunIndex = (activeRunIndex + 1) % runs.length;
      if (activeRunIndex === 0) {
        console.log('\n▹ Todas as corridas foram completadas. Reiniciando ciclo...\n');
      }

      setTimeout(() => startRun(activeRunIndex), PAUSE_BETWEEN_RUNS_MS);
      return;
    }

    const frame = result.value;
    const fullTelemetry = {
      ...frame,
      timestamp: Math.floor(Date.now() / 1000),
      id_corrida: run.id_corrida,
      id_labirinto: run.id_labirinto,
      objetivo: frame.estado_fsm === 'GOAL_REACHED' ? 'S' : 'N',
      pwm_esq: frame.velocidade_media > 0.6 ? 210 + Math.round(noise(2)) : 120 + Math.round(noise(4)),
      pwm_dir: frame.velocidade_media > 0.6 ? 212 + Math.round(noise(2)) : 120 + Math.round(noise(4)),
    };

    const msgBuffer = Buffer.from(encode(fullTelemetry));

    client.send(msgBuffer, 0, msgBuffer.length, UDP_PORT, UDP_HOST, (err) => {
      if (err) console.error('[Mock Sender] Erro ao enviar UDP:', err.message);
    });

    console.log(
      `[Mock Sender] [${run.id_corrida}] ` +
      `pos=(${frame.posicao_x},${frame.posicao_y}) ${frame.orientacao} ` +
      `bat=${frame.bateria_v}V vel=${frame.velocidade_media}m/s ` +
      `pid=${frame.erro_pid} frontal=${frame.dist_frontal}mm ` +
      `estado=${frame.estado_fsm}`
    );
  }, SEND_INTERVAL_MS);
}

// ─── Início ──────────────────────────────────────────────────────
console.log(`[Mock Sender] Iniciando simulador de telemetria UDP (${UDP_HOST}:${UDP_PORT})`);
console.log(`[Mock Sender] Intervalo entre amostras: ${SEND_INTERVAL_MS}ms`);
console.log(`[Mock Sender] Simulando ${runs.length} corridas sequenciais em loop.`);
console.log(`[Mock Sender] Pressione CTRL+C para parar.\n`);

startRun(0);

process.on('SIGINT', () => {
  if (intervalHandle) clearInterval(intervalHandle);
  client.close(() => {
    console.log('[Mock Sender] Encerrado.');
    process.exit(0);
  });
});
