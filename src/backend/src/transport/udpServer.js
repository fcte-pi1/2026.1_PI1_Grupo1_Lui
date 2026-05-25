import dgram from 'node:dgram';
import config from '../config/env.js';
import { processTelemetry } from '../services/telemetryService.js';

// Cria servidor UDP
const server = dgram.createSocket('udp4');

server.on('listening', () => {
  const address = server.address();
  console.log(`[UDP] Servidor escutando em ${address.address}:${address.port}`);
});

server.on('message', processTelemetry);

server.on('error', (err) => {
  console.error(`[UDP] Erro no servidor: ${err.message}`);
  server.close();
});

// Inicia escuta
server.bind(config.UDP_PORT, config.UDP_HOST);

export { server };
