import dgram from 'node:dgram';
import { encode } from '@msgpack/msgpack';
import { jest } from '@jest/globals';
import { startServer, shutdown, io, writeApi } from '../index.js';

const TEST_UDP_PORT = 41236;
const TEST_WS_PORT = 3006;

let client;
let consoleLogSpy;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  
  // Mock writeApi of InfluxDB to avoid connecting/writing to InfluxDB
  jest.spyOn(writeApi, 'writePoint').mockImplementation(() => {});
  jest.spyOn(writeApi, 'flush').mockImplementation(() => Promise.resolve());
  
  consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  startServer(TEST_UDP_PORT, TEST_WS_PORT);
  client = dgram.createSocket('udp4');
});

afterAll(async () => {
  if (client) {
    client.close();
  }
  consoleLogSpy.mockRestore();
  await shutdown();
});

const sendUdpPacket = (buffer) => {
  return new Promise((resolve, reject) => {
    client.send(buffer, 0, buffer.length, TEST_UDP_PORT, '127.0.0.1', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Parser Unit Tests: MsgPack & JSON with rota_calculada', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. Parses JSON packets and extracts rota_calculada', async () => {
    const emitSpy = jest.spyOn(io, 'emit');
    
    const route = [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }];
    const payload = {
      id_corrida: 'test_json_route',
      estado_fsm: 'FAST_RUN',
      rota_calculada: route
    };
    
    const jsonStr = JSON.stringify(payload);
    const buffer = Buffer.from(jsonStr);
    
    await sendUdpPacket(buffer);
    await delay(200);

    // Verify socket.emit was called with telemetry and payload
    expect(emitSpy).toHaveBeenCalledWith('telemetry', expect.objectContaining({
      id_corrida: 'test_json_route',
      rota_calculada: route
    }));

    // Verify console.log was called for "Rota otimizada recebida"
    const logCalls = consoleLogSpy.mock.calls.map(args => args.join(' '));
    expect(logCalls.some(log => log.includes('Rota otimizada recebida: 3 passos'))).toBe(true);
  });

  test('2. Parses MsgPack packets and extracts rota_calculada', async () => {
    const emitSpy = jest.spyOn(io, 'emit');
    
    const route = [{ x: 1, y: 1 }, { x: 1, y: 2 }];
    const payload = {
      id_corrida: 'test_msgpack_route',
      estado_fsm: 'FAST_RUN',
      rota_calculada: route
    };
    
    const buffer = Buffer.from(encode(payload));
    
    await sendUdpPacket(buffer);
    await delay(200);

    // Verify socket.emit was called with telemetry and payload
    expect(emitSpy).toHaveBeenCalledWith('telemetry', expect.objectContaining({
      id_corrida: 'test_msgpack_route',
      rota_calculada: route
    }));

    // Verify console.log was called for "Rota otimizada recebida"
    const logCalls = consoleLogSpy.mock.calls.map(args => args.join(' '));
    expect(logCalls.some(log => log.includes('Rota otimizada recebida: 2 passos'))).toBe(true);
  });
});
