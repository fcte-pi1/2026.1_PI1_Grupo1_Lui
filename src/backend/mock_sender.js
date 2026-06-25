import dgram from 'node:dgram';
import { encode } from '@msgpack/msgpack';
import dotenv from 'dotenv';

dotenv.config();

const UDP_PORT = process.env.UDP_PORT ? parseInt(process.env.UDP_PORT, 10) : 41234;
const UDP_HOST = process.env.UDP_HOST || '127.0.0.1';

const client = dgram.createSocket('udp4');

// Definições de corridas diferentes para simular comportamentos variados
// TODAS começam em (0,0) — movimentos graduais e dentro dos limites do mapa
const runs = [

    {
    id_corrida: "run_test_01_demo_4x4",
    id_labirinto: "4x4_demo",
    mazeSize: 4,
    mapping: true,
    stream: [
      { estado_fsm: "CALIBRATING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 150, paredes: 12, calibration_progress: 25, tof_status: 0 },
      { estado_fsm: "CALIBRATING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 150, paredes: 12, calibration_progress: 60, tof_status: 5 },
      { estado_fsm: "CALIBRATING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 150, paredes: 12, calibration_progress: 100, tof_status: 7 },
      { estado_fsm: "MAPPING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 150, paredes: 12 },
      { estado_fsm: "MAPPING",     bateria_v: 7.38, posicao_x: 0, posicao_y: 1, orientacao: "NORTE", erro_pid: 0.02, dist_frontal: 145, paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 7.36, posicao_x: 0, posicao_y: 2, orientacao: "NORTE", erro_pid: 0.01, dist_frontal: 140, paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 7.34, posicao_x: 0, posicao_y: 3, orientacao: "NORTE", erro_pid:-0.01, dist_frontal: 135, paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 7.32, posicao_x: 1, posicao_y: 3, orientacao: "LESTE", erro_pid: 0.03, dist_frontal: 130, paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 7.32, posicao_x: 1, posicao_y: 3, orientacao: "LESTE", erro_pid: 0.03, dist_frontal: 130, paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 7.32, posicao_x: 2, posicao_y: 3, orientacao: "SUL", erro_pid: 0.03, dist_frontal: 130, paredes: 0  },
      { estado_fsm: "MAPPING",     bateria_v: 7.32, posicao_x: 2, posicao_y: 2, orientacao: "SUL", erro_pid: 0.03, dist_frontal: 130, paredes: 0  },
      { estado_fsm: "GOAL_REACHED",     bateria_v: 7.32, posicao_x: 2, posicao_y: 2, orientacao: "SUL", erro_pid: 0.03, dist_frontal: 130, paredes: 0  },
    ]
  },
  // ═══ 1. DEMO 8x8 — Explora perimeter até o centro ═══
  {
    id_corrida: "run_test_04_demo_8x8",
    id_labirinto: "8x8_demo",
    mazeSize: 8,
    mapping: true,
    stream: [
      { estado_fsm: "CALIBRATING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 150, paredes: 12, calibration_progress: 25, tof_status: 0 },
      { estado_fsm: "CALIBRATING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 150, paredes: 12, calibration_progress: 60, tof_status: 5 },
      { estado_fsm: "CALIBRATING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 150, paredes: 12, calibration_progress: 100, tof_status: 7 },
      { estado_fsm: "MAPPING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 150, paredes: 12 },
      { estado_fsm: "MAPPING",     bateria_v: 7.38, posicao_x: 0, posicao_y: 1, orientacao: "NORTE", erro_pid: 0.02, dist_frontal: 145, paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 7.36, posicao_x: 0, posicao_y: 2, orientacao: "NORTE", erro_pid: 0.01, dist_frontal: 140, paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 7.34, posicao_x: 0, posicao_y: 3, orientacao: "NORTE", erro_pid:-0.01, dist_frontal: 135, paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 7.32, posicao_x: 0, posicao_y: 4, orientacao: "NORTE", erro_pid: 0.03, dist_frontal: 130, paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 7.30, posicao_x: 0, posicao_y: 5, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 125, paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 7.28, posicao_x: 0, posicao_y: 6, orientacao: "NORTE", erro_pid:-0.02, dist_frontal: 120, paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 7.26, posicao_x: 0, posicao_y: 7, orientacao: "NORTE", erro_pid: 0.01, dist_frontal: 115, paredes: 9  },
      { estado_fsm: "MAPPING",     bateria_v: 7.24, posicao_x: 1, posicao_y: 7, orientacao: "LESTE", erro_pid: 0.02, dist_frontal: 110, paredes: 1  },
      { estado_fsm: "MAPPING",     bateria_v: 7.22, posicao_x: 2, posicao_y: 7, orientacao: "LESTE", erro_pid: 0.00, dist_frontal: 105, paredes: 1  },
      { estado_fsm: "MAPPING",     bateria_v: 7.20, posicao_x: 3, posicao_y: 7, orientacao: "LESTE", erro_pid:-0.01, dist_frontal: 100, paredes: 1  },
      { estado_fsm: "MAPPING",     bateria_v: 7.18, posicao_x: 4, posicao_y: 7, orientacao: "LESTE", erro_pid: 0.03, dist_frontal: 95,  paredes: 1  },
      { estado_fsm: "MAPPING",     bateria_v: 7.16, posicao_x: 5, posicao_y: 7, orientacao: "LESTE", erro_pid: 0.01, dist_frontal: 90,  paredes: 1  },
      { estado_fsm: "MAPPING",     bateria_v: 7.14, posicao_x: 6, posicao_y: 7, orientacao: "LESTE", erro_pid:-0.02, dist_frontal: 85,  paredes: 1  },
      { estado_fsm: "MAPPING",     bateria_v: 7.12, posicao_x: 5, posicao_y: 7, orientacao: "OESTE",   erro_pid: 0.02, dist_frontal: 80,  paredes: 1  },
      { estado_fsm: "MAPPING",     bateria_v: 7.12, posicao_x: 4, posicao_y: 7, orientacao: "OESTE",   erro_pid: 0.02, dist_frontal: 80,  paredes: 1  },
      { estado_fsm: "MAPPING",     bateria_v: 7.12, posicao_x: 3, posicao_y: 7, orientacao: "OESTE",   erro_pid: 0.02, dist_frontal: 80,  paredes: 1  },
      { estado_fsm: "MAPPING",     bateria_v: 7.10, posicao_x: 3, posicao_y: 6, orientacao: "SUL",   erro_pid:-0.01, dist_frontal: 75,  paredes: 0  },
      { estado_fsm: "MAPPING",     bateria_v: 7.08, posicao_x: 3, posicao_y: 5, orientacao: "SUL",   erro_pid: 0.03, dist_frontal: 70,  paredes: 0  },
      { estado_fsm: "MAPPING",     bateria_v: 7.06, posicao_x: 3, posicao_y: 4, orientacao: "SUL",   erro_pid: 0.00, dist_frontal: 65,  paredes: 0  },
      { estado_fsm: "MAPPING",     bateria_v: 7.04, posicao_x: 3, posicao_y: 3, orientacao: "SUL",   erro_pid:-0.02, dist_frontal: 60,  paredes: 0  },
      { estado_fsm: "GOAL_REACHED", bateria_v: 7.00, posicao_x: 3, posicao_y: 3, orientacao: "SUL",   erro_pid: 0.00, dist_frontal: 60,  paredes: 0  },
    ]
  },
  // ═══ 2. CORRIDA 16x16 — Sucesso até o centro ═══
  {
    id_corrida: "run_test_01_sucesso",
    id_labirinto: "16x16_standard",
    mazeSize: 16,
    mapping: true,
    stream: [
      { estado_fsm: "CALIBRATING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 150, paredes: 12, calibration_progress: 25, tof_status: 0 },
      { estado_fsm: "CALIBRATING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 150, paredes: 12, calibration_progress: 60, tof_status: 5 },
      { estado_fsm: "CALIBRATING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 150, paredes: 12, calibration_progress: 100, tof_status: 7 },
      { estado_fsm: "MAPPING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 150, paredes: 12 },
      { estado_fsm: "MAPPING",     bateria_v: 7.38, posicao_x: 0, posicao_y: 1, orientacao: "NORTE", erro_pid: 0.03, dist_frontal: 140, paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 7.36, posicao_x: 0, posicao_y: 2, orientacao: "NORTE", erro_pid:-0.01, dist_frontal: 130, paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 7.34, posicao_x: 0, posicao_y: 3, orientacao: "NORTE", erro_pid: 0.02, dist_frontal: 120, paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 7.32, posicao_x: 0, posicao_y: 4, orientacao: "NORTE", erro_pid:-0.03, dist_frontal: 110, paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 7.30, posicao_x: 0, posicao_y: 5, orientacao: "NORTE", erro_pid: 0.01, dist_frontal: 100, paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 7.28, posicao_x: 0, posicao_y: 6, orientacao: "NORTE", erro_pid: 0.02, dist_frontal: 90,  paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 7.26, posicao_x: 0, posicao_y: 7, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 80,  paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 7.24, posicao_x: 1, posicao_y: 7, orientacao: "LESTE", erro_pid: 0.01, dist_frontal: 80,  paredes: 0  },
      { estado_fsm: "MAPPING",     bateria_v: 7.22, posicao_x: 2, posicao_y: 7, orientacao: "LESTE", erro_pid:-0.01, dist_frontal: 80,  paredes: 0  },
      { estado_fsm: "MAPPING",     bateria_v: 7.20, posicao_x: 3, posicao_y: 7, orientacao: "LESTE", erro_pid: 0.02, dist_frontal: 80,  paredes: 0  },
      { estado_fsm: "MAPPING",     bateria_v: 7.18, posicao_x: 4, posicao_y: 7, orientacao: "LESTE", erro_pid: 0.00, dist_frontal: 80,  paredes: 0  },
      { estado_fsm: "MAPPING",     bateria_v: 7.16, posicao_x: 5, posicao_y: 7, orientacao: "LESTE", erro_pid:-0.02, dist_frontal: 80,  paredes: 0  },
      { estado_fsm: "MAPPING",     bateria_v: 7.14, posicao_x: 6, posicao_y: 7, orientacao: "LESTE", erro_pid: 0.01, dist_frontal: 80,  paredes: 0  },
      { estado_fsm: "MAPPING",     bateria_v: 7.12, posicao_x: 7, posicao_y: 7, orientacao: "LESTE", erro_pid: 0.00, dist_frontal: 80,  paredes: 0  },
      { estado_fsm: "MAPPING",     bateria_v: 7.10, posicao_x: 7, posicao_y: 8, orientacao: "NORTE", erro_pid: 0.02, dist_frontal: 80,  paredes: 0  },
      { estado_fsm: "MAPPING",     bateria_v: 7.08, posicao_x: 7, posicao_y: 9, orientacao: "NORTE", erro_pid:-0.01, dist_frontal: 80,  paredes: 0  },
      { estado_fsm: "GOAL_REACHED",bateria_v: 7.05, posicao_x: 7, posicao_y: 9, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 80,  paredes: 0  },
    ]
  },
  // ═══ 3. CORRIDA 16x16 — Falha de bateria ═══
  {
    id_corrida: "run_test_02_falha_bateria",
    id_labirinto: "16x16_standard",
    mazeSize: 16,
    mapping: true,
    stream: [
      { estado_fsm: "CALIBRATING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 150, paredes: 12, calibration_progress: 25, tof_status: 0 },
      { estado_fsm: "CALIBRATING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 150, paredes: 12, calibration_progress: 60, tof_status: 5 },
      { estado_fsm: "CALIBRATING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 150, paredes: 12, calibration_progress: 100, tof_status: 7 },
      { estado_fsm: "MAPPING",     bateria_v: 7.10, posicao_x: 0, posicao_y: 1, orientacao: "NORTE", erro_pid: 0.03, dist_frontal: 140, paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 6.80, posicao_x: 0, posicao_y: 2, orientacao: "NORTE", erro_pid:-0.04, dist_frontal: 130, paredes: 8  },
      { estado_fsm: "MAPPING",     bateria_v: 6.50, posicao_x: 0, posicao_y: 3, orientacao: "NORTE", erro_pid: 0.05, dist_frontal: 120, paredes: 8  },
      { estado_fsm: "ERROR",       bateria_v: 5.75, posicao_x: 0, posicao_y: 3, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 120, paredes: 8  },
    ]
  },
  // ═══ 4. FAST RUN 8x8 — Corrida rápida ═══
  {
    id_corrida: "run_test_03_fast_run",
    id_labirinto: "8x8_demo",
    mazeSize: 8,
    mapping: false,
    stream: [
      { estado_fsm: "CALIBRATING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 150, paredes: 12, calibration_progress: 25, tof_status: 0 },
      { estado_fsm: "CALIBRATING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 150, paredes: 12, calibration_progress: 60, tof_status: 5 },
      { estado_fsm: "CALIBRATING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 150, paredes: 12, calibration_progress: 100, tof_status: 7 },
      { estado_fsm: "FAST_RUN",    bateria_v: 7.35, posicao_x: 0, posicao_y: 1, orientacao: "NORTE", erro_pid: 0.02, dist_frontal: 140, paredes: 8  },
      { estado_fsm: "FAST_RUN",    bateria_v: 7.30, posicao_x: 0, posicao_y: 2, orientacao: "NORTE", erro_pid:-0.01, dist_frontal: 130, paredes: 8  },
      { estado_fsm: "FAST_RUN",    bateria_v: 7.25, posicao_x: 0, posicao_y: 3, orientacao: "NORTE", erro_pid: 0.03, dist_frontal: 120, paredes: 8  },
      { estado_fsm: "FAST_RUN",    bateria_v: 7.20, posicao_x: 0, posicao_y: 4, orientacao: "NORTE", erro_pid:-0.02, dist_frontal: 110, paredes: 8  },
      { estado_fsm: "FAST_RUN",    bateria_v: 7.15, posicao_x: 0, posicao_y: 5, orientacao: "NORTE", erro_pid: 0.01, dist_frontal: 100, paredes: 8  },
      { estado_fsm: "FAST_RUN",    bateria_v: 7.10, posicao_x: 0, posicao_y: 6, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 90,  paredes: 8  },
      { estado_fsm: "FAST_RUN",    bateria_v: 7.05, posicao_x: 0, posicao_y: 7, orientacao: "NORTE", erro_pid:-0.01, dist_frontal: 80,  paredes: 9  },
      { estado_fsm: "GOAL_REACHED",bateria_v: 7.00, posicao_x: 0, posicao_y: 7, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 80,  paredes: 9  },
    ]
  }
];

let activeRunIndex = 0;
let currentStepIndex = 0;

function sendTelemetry() {
  const currentRun = runs[activeRunIndex];
  const stepData = currentRun.stream[currentStepIndex];

  const isFastRun = stepData.estado_fsm === "FAST_RUN";
  const fullTelemetry = {
    ...stepData,
    paredes: stepData.paredes !== undefined ? stepData.paredes : 0,
    mazeSize: currentRun.mazeSize || 16,
    mapping: currentRun.mapping !== undefined ? currentRun.mapping : true,
    timestamp: Math.floor(Date.now() / 1000),
    id_corrida: currentRun.id_corrida,
    id_labirinto: currentRun.id_labirinto,
    tamanho_grade: currentRun.mazeSize || 16,
    objetivo: stepData.estado_fsm === "GOAL_REACHED" ? "S" : "N",
    dist_esq: 85 + Math.floor(Math.sin(currentStepIndex) * 5),
    dist_dir: 85 - Math.floor(Math.sin(currentStepIndex) * 5),
    pwm_esq: isFastRun ? 210 : 120 + Math.floor(Math.random() * 8),
    pwm_dir: isFastRun ? 212 : 120 + Math.floor(Math.random() * 8),
    velocidade_media: isFastRun ? 0.85 + (Math.random() * 0.05) : 0.35 + (Math.random() * 0.03),
  };

  const msgBuffer = Buffer.from(encode(fullTelemetry));

  console.log(`[Mock Sender] [${currentRun.id_corrida}] Passo ${currentStepIndex + 1}/${currentRun.stream.length} | Pos: (${stepData.posicao_x},${stepData.posicao_y}) ${stepData.orientacao}`);

  client.send(msgBuffer, 0, msgBuffer.length, UDP_PORT, UDP_HOST, (err) => {
    if (err) console.error('[Mock Sender] Erro:', err.message);
  });

  currentStepIndex++;
  if (currentStepIndex >= currentRun.stream.length) {
    console.log(`\n=== FIM: ${currentRun.id_corrida} ===`);
    activeRunIndex = (activeRunIndex + 1) % runs.length;
    currentStepIndex = 0;
    console.log(`=== PROXIMA: ${runs[activeRunIndex].id_corrida} ===\n`);
  }
}

const DELAY_INICIAL_MS = 10000;
const INTERVALO_MS = 2000;

console.log(`[Mock Sender] Aguardando ${DELAY_INICIAL_MS / 1000}s para iniciar...`);
console.log(`[Mock Sender] ${runs.length} corridas, ${INTERVALO_MS / 1000}s entre passos.`);

setTimeout(() => {
  console.log('[Mock Sender] Transmitindo!\n');
  sendTelemetry();
  const interval = setInterval(sendTelemetry, INTERVALO_MS);
  process.on('SIGINT', () => {
    clearInterval(interval);
    client.close(() => { console.log('[Mock Sender] Encerrado.'); process.exit(0); });
  });
}, DELAY_INICIAL_MS);
