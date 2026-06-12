import dgram from 'node:dgram';
import { encode } from '@msgpack/msgpack';
import { InfluxDB } from '@influxdata/influxdb-client';
import { jest } from '@jest/globals';
import { startServer, shutdown } from '../src/services/telemetryService.js';
import dotenv from 'dotenv';

dotenv.config();

const TEST_UDP_PORT = 41236; // Different port to avoid conflict
const TEST_WS_PORT = 3006;
const INFLUX_URL = process.env.INFLUX_URL || 'http://localhost:8086';
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || 'micromouse-token-12345';
const INFLUX_ORG = process.env.INFLUX_ORG || 'micromouse';
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'micromouse_telemetria';

const queryApi = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN }).getQueryApi(INFLUX_ORG);
let client;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  startServer(TEST_UDP_PORT, TEST_WS_PORT);
  client = dgram.createSocket('udp4');
});

afterAll(async () => {
  if (client) {
    client.close();
  }
  await shutdown();
});

const sendRawBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    client.send(buffer, 0, buffer.length, TEST_UDP_PORT, '127.0.0.1', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const sendPacket = (payload) => {
  return sendRawBuffer(Buffer.from(encode(payload)));
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('MsgPack Decoding & Dynamic Mapping (Issues 212 & 213)', () => {
  let mockConsoleError;
  let mockConsoleLog;

  beforeEach(() => {
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
    mockConsoleLog.mockRestore();
  });

  test('Issue 212: Pacote inválido (não-MsgPack) cai no catch com log', async () => {
    const invalidBuffer = Buffer.from('isto nao é msgpack');
    await sendRawBuffer(invalidBuffer);
    await delay(200);

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('[UDP] Erro ao processar mensagem ou decodificar MsgPack:'),
      expect.anything()
    );
  });

  test('Issue 212 & 213: Pacote decodifica corretamente e aplica mapeamento de campos float, string e int', async () => {
    const runId = `test_msgpack_${Date.now()}`;
    const payload = {
      id_corrida: runId,
      id_labirinto: 'lab_test',
      objetivo: 'S',
      estado_fsm: 'MAPPING',
      bateria_v: 7.35, // testando float e fallback pra 'bateria'
      posicao_x: 5,    // testando fallback para 'pos_x'
      orientacao: 'SUL'
    };

    await sendPacket(payload);
    await delay(1000);

    const fluxQuery = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: -1m)
        |> filter(fn: (r) => r["_measurement"] == "log_corrida")
        |> filter(fn: (r) => r["id_corrida"] == "${runId}")
    `;

    const results = [];
    await new Promise((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) { results.push(tableMeta.toObject(row)); },
        error(err) { reject(err); },
        complete() { resolve(); }
      });
    });

    expect(results.length).toBeGreaterThan(0);

    // Tags mapeadas
    const batteryRecord = results.find(r => r._field === 'bateria');
    expect(batteryRecord).toBeDefined();
    expect(batteryRecord._value).toBeCloseTo(7.35, 2);
    expect(batteryRecord.id_labirinto).toBe('lab_test');
    expect(batteryRecord.estado_robo).toBe('MAPPING'); // Tag estado_robo foi populada de estado_fsm
    expect(batteryRecord.objetivo).toBe('S');

    const posXRecord = results.find(r => r._field === 'pos_x');
    expect(posXRecord).toBeDefined();
    expect(posXRecord._value).toBe(5);

    const orientacaoRecord = results.find(r => r._field === 'orientacao');
    expect(orientacaoRecord).toBeDefined();
    expect(orientacaoRecord._value).toBe('SUL');
  });

  test('Issue 213: Fallback de estado_robo e conversão de timestamp Unix para ms', async () => {
    const runId = `test_timestamp_${Date.now()}`;
    // Timestamp within last minute so `range(start: -1m)` works
    const unixTimestamp = Date.now() - 10000;
    
    const payload = {
      id_corrida: runId,
      estado_robo: 'ERROR', // usando estado_robo em vez de estado_fsm
      pos_y: 2,
      timestamp: unixTimestamp
    };

    await sendPacket(payload);
    await delay(1000);

    const fluxQuery = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: -1m)
        |> filter(fn: (r) => r["_measurement"] == "log_corrida")
        |> filter(fn: (r) => r["id_corrida"] == "${runId}")
    `;

    const results = [];
    await new Promise((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) { results.push(tableMeta.toObject(row)); },
        error(err) { reject(err); },
        complete() { resolve(); }
      });
    });

    expect(results.length).toBeGreaterThan(0);
    const posYRecord = results.find(r => r._field === 'pos_y');
    expect(posYRecord).toBeDefined();
    expect(posYRecord.estado_robo).toBe('ERROR');
    
    // Verifica se a data foi salva corretamente (agora o backend assume ms direto)
    const recordDate = new Date(posYRecord._time);
    expect(recordDate.getTime()).toBe(unixTimestamp);
  });

  test('Issue 212: Pacote com campos faltando não lança exceção e salva usando fallback Timestamp Date()', async () => {
    const runId = `test_missing_${Date.now()}`;
    const payload = {
      id_corrida: runId,
      // Falta id_labirinto, estado_robo, posicao, etc
      bateria: 8.0 // Usando a chave antiga pra ver se pega
    };

    await sendPacket(payload);
    await delay(1000);

    const fluxQuery = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: -1m)
        |> filter(fn: (r) => r["_measurement"] == "log_corrida")
        |> filter(fn: (r) => r["id_corrida"] == "${runId}")
    `;

    const results = [];
    await new Promise((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) { results.push(tableMeta.toObject(row)); },
        error(err) { reject(err); },
        complete() { resolve(); }
      });
    });

    expect(results.length).toBeGreaterThan(0);
    const batteryRecord = results.find(r => r._field === 'bateria');
    expect(batteryRecord).toBeDefined();
    expect(batteryRecord._value).toBe(8.0);
    expect(batteryRecord.id_labirinto).toBe('default'); // Default value fallback
    expect(batteryRecord.estado_robo).toBe('IDLE'); // Default value fallback
  });
});
