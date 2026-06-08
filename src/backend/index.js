import dgram from 'node:dgram';
import { decode } from '@msgpack/msgpack';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import dotenv from 'dotenv';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config();

const UDP_PORT = process.env.UDP_PORT ? parseInt(process.env.UDP_PORT, 10) : 41234;
const UDP_HOST = process.env.UDP_HOST || '0.0.0.0';
const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 3001;

const INFLUX_URL = process.env.INFLUX_URL || 'http://localhost:8086';
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || 'micromouse-token-12345';
const INFLUX_ORG = process.env.INFLUX_ORG || 'micromouse';
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'micromouse_telemetria';

console.log('--- CONFIGURAÇÃO DO BACKEND ---');
console.log(`Porta UDP: ${UDP_PORT}`);
console.log(`Endereço UDP: ${UDP_HOST}`);
console.log(`Porta WS: ${WS_PORT}`);
console.log(`InfluxDB URL: ${INFLUX_URL}`);
console.log(`InfluxDB Org: ${INFLUX_ORG}`);
console.log(`InfluxDB Bucket: ${INFLUX_BUCKET}`);
console.log('--------------------------------');

// Inicializa cliente InfluxDB
export const influxDB = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
export const writeApi = influxDB.getWriteApi(INFLUX_ORG, INFLUX_BUCKET, 'ns');

// --- AUTOMAÇÃO DO HISTÓRICO JSON ---
const sessoesAtivas = {};
// Usa __dirname para garantir que sempre ache a pasta src/maze_runs, independente de onde o node foi rodado
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAZE_RUNS_DIR = path.resolve(__dirname, '../maze_runs');

if (!fs.existsSync(MAZE_RUNS_DIR)) {
  fs.mkdirSync(MAZE_RUNS_DIR, { recursive: true });
}
// -----------------------------------

// Cria servidor HTTP e WebSocket
export const httpServer = createServer();
export const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`[WS] Novo cliente conectado: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[WS] Cliente desconectado: ${socket.id}`);
  });
});

// Cria servidor UDP
export const server = dgram.createSocket('udp4');

server.on('listening', () => {
  const address = server.address();
  console.log(`[UDP] Servidor escutando em ${address.address}:${address.port}`);
});

server.on('message', (msg, rinfo) => {
  try {
    // Decodifica o payload recebido via MsgPack
    const data = decode(msg);
    console.log(`[UDP] Recebido de ${rinfo.address}:${rinfo.port}:`, data);

    // Envia dados para clientes conectados via WebSocket
    io.emit('telemetry', data);

    // Mapeamento dinâmico e seguro para o esquema InfluxDB
    const estado_robo = data.estado_fsm || data.estado_robo || 'IDLE';
    const id_labirinto = data.id_labirinto || 'default';
    const id_corrida = data.id_corrida || 'default';
    const objetivo = data.objetivo || 'N';

    // --- LÓGICA DE GERAÇÃO DO JSON AUTOMÁTICO ---
    if (!sessoesAtivas[id_corrida]) {
      sessoesAtivas[id_corrida] = {
        id_corrida,
        historico: []
      };
    }

    const pos_x = data.posicao_x !== undefined ? data.posicao_x : data.pos_x;
    const pos_y = data.posicao_y !== undefined ? data.posicao_y : data.pos_y;

    // Se tiver coordenadas, adiciona na memória (evita lixo de quando o robô tá desligado)
    if (pos_x !== undefined && pos_y !== undefined && (estado_robo === 'MAPPING' || estado_robo === 'FAST_RUN' || estado_robo === 'GOAL_REACHED' || estado_robo === 'FINISHED')) {
      // Pega a parede ou usa o decoder da Bitmask (Issue #145 futura)
      const passo_historico = {
        x: pos_x,
        y: pos_y,
        orientacao: data.orientacao || 'NORTE',
        paredes: data.paredes || []
      };
      
      // Só adiciona se o robô se moveu para não floodar o json com o robô parado
      const length = sessoesAtivas[id_corrida].historico.length;
      const ultimo = length > 0 ? sessoesAtivas[id_corrida].historico[length - 1] : null;
      if (!ultimo || ultimo.x !== passo_historico.x || ultimo.y !== passo_historico.y || ultimo.orientacao !== passo_historico.orientacao || passo_historico.paredes.length > 0) {
        sessoesAtivas[id_corrida].historico.push(passo_historico);
      }
    }

    // Gatilho final (Issue #243)
    if (estado_robo === 'FINISHED' || estado_robo === 'GOAL_REACHED') {
      console.log(`[JSON Automático] Gatilho de fim recebido para corrida: ${id_corrida}`);
      if (sessoesAtivas[id_corrida] && sessoesAtivas[id_corrida].historico.length > 0) {
        const timestamp = Date.now();
        const filename = `corrida_${timestamp}.json`;
        const filepath = path.join(MAZE_RUNS_DIR, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(sessoesAtivas[id_corrida], null, 2), 'utf-8');
        console.log(`[JSON Automático] Arquivo salvo com sucesso: ${filepath}`);
      }
      // Limpa a RAM
      delete sessoesAtivas[id_corrida];
    }
    // ---------------------------------------------

    const point = new Point('log_corrida')
      .tag('id_labirinto', id_labirinto)
      .tag('id_corrida', id_corrida)
      .tag('objetivo', objetivo)
      .tag('estado_robo', estado_robo);

    // Campos (Fields) numéricos ou strings
    const floatFields = {
      bateria: data.bateria_v !== undefined ? data.bateria_v : data.bateria,
      erro_pid: data.erro_pid,
      velocidade_media: data.velocidade_media
    };

    const intFields = {
      pos_x: data.posicao_x !== undefined ? data.posicao_x : data.pos_x,
      pos_y: data.posicao_y !== undefined ? data.posicao_y : data.pos_y,
      dist_frontal: data.dist_frontal,
      dist_esq: data.dist_esq,
      dist_dir: data.dist_dir,
      pwm_esq: data.pwm_esq,
      pwm_dir: data.pwm_dir
    };

    const stringFields = {
      orientacao: data.orientacao
    };

    // Adiciona Fields Float
    for (const [key, val] of Object.entries(floatFields)) {
      if (val !== undefined && val !== null) {
        point.floatField(key, parseFloat(val));
      }
    }

    // Adiciona Fields Int
    for (const [key, val] of Object.entries(intFields)) {
      if (val !== undefined && val !== null) {
        point.intField(key, parseInt(val, 10));
      }
    }

    // Adiciona Fields String
    for (const [key, val] of Object.entries(stringFields)) {
      if (val !== undefined && val !== null) {
        point.stringField(key, String(val));
      }
    }

    // Define timestamp (se vier em segundos Unix, converte para ns)
    if (data.timestamp) {
      const tsMs = data.timestamp < 9999999999 ? data.timestamp * 1000 : data.timestamp;
      point.timestamp(new Date(tsMs));
    } else {
      point.timestamp(new Date()); // Se não tiver, usa hora atual do servidor
    }

    // Grava ponto no InfluxDB
    writeApi.writePoint(point);
    
    // Tenta flush para persistência imediata (útil para desenvolvimento)
    writeApi.flush()
      .then(() => {
        console.log(`[InfluxDB] Ponto gravado com sucesso no bucket: ${INFLUX_BUCKET}`);
      })
      .catch((err) => {
        console.error('[InfluxDB] Erro ao gravar ponto:', err.message);
      });

  } catch (err) {
    console.error('[UDP] Erro ao processar mensagem ou decodificar MsgPack:', err.message);
    console.log('[UDP] Pacote bruto recebido (String):', msg.toString());
  }
});

server.on('error', (err) => {
  console.error(`[UDP] Erro no servidor: ${err.message}`);
  server.close();
});

export function startServer(overrideUdpPort = UDP_PORT, overrideWsPort = WS_PORT) {
  httpServer.listen(overrideWsPort, () => {
    console.log(`[WS] Servidor WebSocket escutando na porta ${overrideWsPort}`);
  });
  server.bind(overrideUdpPort, UDP_HOST);
}

// Inicia escuta automaticamente se não estiver em ambiente de teste
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Encerramento limpo
export const shutdown = () => {
  return new Promise((resolve) => {
    console.log('Encerrando servidor...');
    io.close();
    httpServer.close();
    server.close(() => {
      writeApi.close()
        .then(() => {
          console.log('Conexões com InfluxDB encerradas.');
          if (process.env.NODE_ENV !== 'test') process.exit(0);
          resolve();
        })
        .catch((err) => {
          console.error('Erro ao fechar conexão com InfluxDB:', err);
          if (process.env.NODE_ENV !== 'test') process.exit(1);
          resolve();
        });
    });
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
