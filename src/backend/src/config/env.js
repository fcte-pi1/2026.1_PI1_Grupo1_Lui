import dotenv from 'dotenv';

dotenv.config();

const config = {
  UDP_PORT: process.env.UDP_PORT ? parseInt(process.env.UDP_PORT, 10) : 41234,
  UDP_HOST: process.env.UDP_HOST || '0.0.0.0',
  INFLUX_URL: process.env.INFLUX_URL || 'http://localhost:8086',
  INFLUX_TOKEN: process.env.INFLUX_TOKEN || 'micromouse-token-12345',
  INFLUX_ORG: process.env.INFLUX_ORG || 'micromouse',
  INFLUX_BUCKET: process.env.INFLUX_BUCKET || 'micromouse_telemetria',
};

console.log('--- CONFIGURAÇÃO DO BACKEND ---');
console.log(`Porta UDP: ${config.UDP_PORT}`);
console.log(`Endereço UDP: ${config.UDP_HOST}`);
console.log(`InfluxDB URL: ${config.INFLUX_URL}`);
console.log(`InfluxDB Org: ${config.INFLUX_ORG}`);
console.log(`InfluxDB Bucket: ${config.INFLUX_BUCKET}`);
console.log('--------------------------------');

export default config;
