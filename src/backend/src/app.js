import { server } from './transport/udpServer.js';
import { writeApi } from './db/influx.js';

// Encerramento limpo
const shutdown = () => {
  console.log('Encerrando servidor...');
  server.close(() => {
    writeApi.close()
      .then(() => {
        console.log('Conexões com InfluxDB encerradas.');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Erro ao fechar conexão com InfluxDB:', err);
        process.exit(1);
      });
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
