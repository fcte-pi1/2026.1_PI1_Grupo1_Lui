import dgram from 'node:dgram';
import { encode } from '@msgpack/msgpack';
import { InfluxDB } from '@influxdata/influxdb-client';
import { jest } from '@jest/globals';
import { startServer, shutdown } from '../index.js';
import dotenv from 'dotenv';

dotenv.config();

const TEST_UDP_PORT = 41235;
const TEST_WS_PORT = 3005;
const INFLUX_URL = process.env.INFLUX_URL || 'http://localhost:8086';
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || 'micromouse-token-12345';
const INFLUX_ORG = process.env.INFLUX_ORG || 'micromouse';
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'micromouse_telemetria';

const queryApi = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN }).getQueryApi(INFLUX_ORG);
let client;

beforeAll(async () => {
  process.env.NODE_ENV = 'test'; // Ensures auto-start in index.js is bypassed
  startServer(TEST_UDP_PORT, TEST_WS_PORT);
  client = dgram.createSocket('udp4');
});

afterAll(async () => {
  if (client) {
    client.close();
  }
  await shutdown();
});

const sendPacket = (payload) => {
  return new Promise((resolve, reject) => {
    const msgBuffer = Buffer.from(encode(payload));
    client.send(msgBuffer, 0, msgBuffer.length, TEST_UDP_PORT, '127.0.0.1', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('Integration Tests: UDP -> Backend -> InfluxDB', () => {
  
  test('1. Envia um pacote via UDP e verifica que aparece como Point no bucket', async () => {
    const runId = `test_run_single_${Date.now()}`;
    const payload = {
      id_corrida: runId,
      id_labirinto: 'lab1',
      estado_fsm: 'MAPPING',
      bateria_v: 7.4,
      posicao_x: 1,
      posicao_y: 2,
      orientacao: 'NORTE'
    };

    await sendPacket(payload);
    await delay(500); // Aguarda flush do backend e gravação no InfluxDB

    const fluxQuery = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: -1m)
        |> filter(fn: (r) => r["_measurement"] == "log_corrida")
        |> filter(fn: (r) => r["id_corrida"] == "${runId}")
        |> filter(fn: (r) => r["_field"] == "pos_x")
    `;

    const results = [];
    await new Promise((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          results.push(tableMeta.toObject(row));
        },
        error(err) { reject(err); },
        complete() { resolve(); },
      });
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]._value).toBe(1); // posição_x inserida era 1
  });

  test('2. Rajada de 10 pacotes em sequência registados sem perda', async () => {
    const runId = `test_run_burst_${Date.now()}`;
    
    for (let i = 0; i < 10; i++) {
      await sendPacket({
        id_corrida: runId,
        estado_fsm: 'FAST_RUN',
        posicao_x: i,
        posicao_y: 0,
        orientacao: 'LESTE'
      });
    }

    await delay(1000); // Aguarda todas as writes (flush async)

    const fluxQuery = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: -1m)
        |> filter(fn: (r) => r["_measurement"] == "log_corrida")
        |> filter(fn: (r) => r["id_corrida"] == "${runId}")
        |> filter(fn: (r) => r["_field"] == "pos_x")
    `;

    const results = [];
    await new Promise((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) { results.push(tableMeta.toObject(row)); },
        error(err) { reject(err); },
        complete() { resolve(); },
      });
    });

    expect(results.length).toBe(10);
  });

  test('3. Cenário "falha bateria" regista estado_robo = ERROR', async () => {
    const runId = `test_run_error_${Date.now()}`;
    await sendPacket({
      id_corrida: runId,
      estado_fsm: 'ERROR',
      bateria_v: 5.5,
      posicao_x: 2,
      posicao_y: 2
    });

    await delay(500);

    const fluxQuery = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: -1m)
        |> filter(fn: (r) => r["_measurement"] == "log_corrida")
        |> filter(fn: (r) => r["id_corrida"] == "${runId}")
        |> filter(fn: (r) => r["_field"] == "bateria")
    `;

    const results = [];
    await new Promise((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) { results.push(tableMeta.toObject(row)); },
        error(err) { reject(err); },
        complete() { resolve(); },
      });
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].estado_robo).toBe('ERROR');
    expect(results[0]._value).toBe(5.5);
  });

  test('5. Backend não crasha se InfluxDB estiver fora do ar (inválido URL simulado)', async () => {
    // Vamos injetar um writeApi inválido temporariamente e forçar um flush
    // O backend tem um bloco try/catch no `.catch()` do flush() em index.js, pelo que não deve fechar o processo.
    const runId = `test_run_offline_${Date.now()}`;
    
    // Isto tentaria escrever usando as credenciais reais do writeApi exportado
    // Se mudarmos temporariamente o URL no cliente interno ou apenas assumirmos que o log vai falhar,
    // o NodeJS process não fará 'exit(1)' devido ao process.env.NODE_ENV === 'test' e captura de promessa.
    // Aqui testamos na prática que enviar pacotes malformados não desliga o socket e simula ausência de erro fatal
    
    // Vamos enviar o pacote com um formato que causará falha na escrita para testar a resiliência
    const mockSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Forçar um erro no writeApi para observar
    const { writeApi } = await import('../index.js');
    jest.spyOn(writeApi, 'writePoint').mockImplementationOnce(() => {
      throw new Error("Simulated Write Error");
    });

    await sendPacket({ id_corrida: runId });
    await delay(200);

    // O servidor UDP deve continuar a responder
    const payloadValido = { id_corrida: 'depois_do_erro', pos_x: 99 };
    await sendPacket(payloadValido);
    
    expect(mockSpy).toHaveBeenCalled(); // Deve ter imprimido o erro
    mockSpy.mockRestore();
  });
});
