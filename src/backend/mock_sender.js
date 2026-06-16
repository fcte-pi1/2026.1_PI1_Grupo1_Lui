import dgram from 'node:dgram';
import { encode } from '@msgpack/msgpack';
import dotenv from 'dotenv';

dotenv.config();

const UDP_PORT = process.env.UDP_PORT ? parseInt(process.env.UDP_PORT, 10) : 41234;
const UDP_HOST = process.env.UDP_HOST || '127.0.0.1';

const client = dgram.createSocket('udp4');

// Definições de corridas diferentes para simular comportamentos variados
const runs = [
  {
    id_corrida: "run_test_01_sucesso",
    id_labirinto: "16x16_standard",
    stream: [
      { estado_fsm: "CALIBRATING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.0, dist_frontal: 150 },
      { estado_fsm: "MAPPING",     bateria_v: 7.38, posicao_x: 0, posicao_y: 1, orientacao: "NORTE", erro_pid: 0.05, dist_frontal: 140 },
      { estado_fsm: "MAPPING",     bateria_v: 7.35, posicao_x: 0, posicao_y: 2, orientacao: "NORTE", erro_pid: -0.02, dist_frontal: 130 },
      { estado_fsm: "MAPPING",     bateria_v: 7.33, posicao_x: 1, posicao_y: 2, orientacao: "LESTE", erro_pid: 0.08, dist_frontal: 120 },
      { estado_fsm: "MAPPING",     bateria_v: 7.31, posicao_x: 2, posicao_y: 2, orientacao: "LESTE", erro_pid: -0.04, dist_frontal: 110 },
      { estado_fsm: "MAPPING",     bateria_v: 7.28, posicao_x: 2, posicao_y: 3, orientacao: "NORTE", erro_pid: 0.01, dist_frontal: 100 },
      { estado_fsm: "MAPPING",     bateria_v: 7.25, posicao_x: 2, posicao_y: 4, orientacao: "NORTE", erro_pid: 0.03, dist_frontal: 90 },
      { estado_fsm: "GOAL_REACHED", bateria_v: 7.22, posicao_x: 2, posicao_y: 4, orientacao: "NORTE", erro_pid: 0.00, dist_frontal: 80 }
    ]
  },
  {
    id_corrida: "run_test_02_falha_bateria",
    id_labirinto: "16x16_standard",
    stream: [
      { estado_fsm: "CALIBRATING", bateria_v: 7.40, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.0, dist_frontal: 150 },
      { estado_fsm: "MAPPING",     bateria_v: 7.10, posicao_x: 0, posicao_y: 1, orientacao: "NORTE", erro_pid: 0.04, dist_frontal: 140 },
      { estado_fsm: "MAPPING",     bateria_v: 6.80, posicao_x: 0, posicao_y: 2, orientacao: "NORTE", erro_pid: -0.05, dist_frontal: 130 },
      { estado_fsm: "MAPPING",     bateria_v: 6.20, posicao_x: 1, posicao_y: 2, orientacao: "LESTE", erro_pid: 0.12, dist_frontal: 120 },
      { estado_fsm: "ERROR",       bateria_v: 5.75, posicao_x: 1, posicao_y: 2, orientacao: "LESTE", erro_pid: 0.00, dist_frontal: 120 },
      { estado_fsm: "ERROR",       bateria_v: 5.50, posicao_x: 1, posicao_y: 2, orientacao: "LESTE", erro_pid: 0.00, dist_frontal: 120 }
    ]
  },
  {
    id_corrida: "run_test_03_fast_run",
    id_labirinto: "16x16_standard",
    stream: [
      { estado_fsm: "FAST_RUN", bateria_v: 7.30, posicao_x: 0, posicao_y: 0, orientacao: "NORTE", erro_pid: 0.01, dist_frontal: 150 },
      { estado_fsm: "FAST_RUN", bateria_v: 7.27, posicao_x: 0, posicao_y: 1, orientacao: "NORTE", erro_pid: 0.02, dist_frontal: 140 },
      { estado_fsm: "FAST_RUN", bateria_v: 7.24, posicao_x: 0, posicao_y: 2, orientacao: "NORTE", erro_pid: -0.01, dist_frontal: 130 },
      { estado_fsm: "FAST_RUN", bateria_v: 7.21, posicao_x: 1, posicao_y: 2, orientacao: "LESTE", erro_pid: 0.03, dist_frontal: 120 },
      { estado_fsm: "FAST_RUN", bateria_v: 7.18, posicao_x: 2, posicao_y: 2, orientacao: "LESTE", erro_pid: -0.02, dist_frontal: 110 },
      { estado_fsm: "FAST_RUN", bateria_v: 7.14, posicao_x: 2, posicao_y: 3, orientacao: "NORTE", erro_pid: 0.01, dist_frontal: 100 },
      { estado_fsm: "FAST_RUN", bateria_v: 7.10, posicao_x: 2, posicao_y: 4, orientacao: "NORTE", erro_pid: 0.02, dist_frontal: 90 }
    ]
  }
];

let activeRunIndex = 0;
let currentStepIndex = 0;

function sendTelemetry() {
  const currentRun = runs[activeRunIndex];
  const stepData = currentRun.stream[currentStepIndex];

  // Adiciona campos calculados/metadados dinâmicos
  const isFastRun = stepData.estado_fsm === "FAST_RUN";
  const fullTelemetry = {
    ...stepData,
    timestamp: Math.floor(Date.now() / 1000),
    id_corrida: currentRun.id_corrida,
    id_labirinto: currentRun.id_labirinto,
    objetivo: stepData.estado_fsm === "GOAL_REACHED" ? "S" : "N",
    dist_esq: 85 + Math.floor(Math.sin(currentStepIndex) * 5),
    dist_dir: 85 - Math.floor(Math.sin(currentStepIndex) * 5),
    // Simula motores mais rápidos e estáveis no FAST_RUN
    pwm_esq: isFastRun ? 210 : 120 + Math.floor(Math.random() * 8),
    pwm_dir: isFastRun ? 212 : 120 + Math.floor(Math.random() * 8),
    velocidade_media: isFastRun ? 0.85 + (Math.random() * 0.05) : 0.35 + (Math.random() * 0.03),
    ...(isFastRun ? {
      rota_calculada: [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 2, y: 3 },
        { x: 2, y: 4 }
      ]
    } : {})
  };

  // Codifica em MsgPack
  const msgBuffer = Buffer.from(encode(fullTelemetry));

  console.log(`[Mock Sender] [${currentRun.id_corrida}] Enviando passo ${currentStepIndex + 1}/${currentRun.stream.length}...`);

  client.send(msgBuffer, 0, msgBuffer.length, UDP_PORT, UDP_HOST, (err) => {
    if (err) {
      console.error('[Mock Sender] Erro ao enviar pacote UDP:', err.message);
    }
  });

  currentStepIndex++;

  // Se a corrida ativa terminar, passa para a próxima após uma breve pausa no console
  if (currentStepIndex >= currentRun.stream.length) {
    console.log(`\n=== FIM DA CORRIDA: ${currentRun.id_corrida} ===`);
    activeRunIndex = (activeRunIndex + 1) % runs.length;
    currentStepIndex = 0;
    console.log(`=== PREPARANDO PRÓXIMA CORRIDA: ${runs[activeRunIndex].id_corrida} ===\n`);
  }
}

console.log(`[Mock Sender] Iniciando simulador de telemetria UDP (${UDP_HOST}:${UDP_PORT})...`);
console.log(`Simulando sequencialmente ${runs.length} tipos de corridas.`);
console.log('Pressione CTRL+C para parar.\n');

// Envia telemetria a cada 1 segundo
const interval = setInterval(sendTelemetry, 1000);

process.on('SIGINT', () => {
  clearInterval(interval);
  client.close(() => {
    console.log('[Mock Sender] Encerrado.');
    process.exit(0);
  });
});
