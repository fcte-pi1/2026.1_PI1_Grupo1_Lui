import { decode } from '@msgpack/msgpack';
import { Point } from '@influxdata/influxdb-client';
import { writeApi } from '../db/influx.js';
import config from '../config/env.js';

export function processTelemetry(msg, rinfo) {
  try {
    // Decodifica o payload recebido via MsgPack
    const data = decode(msg);
    console.log(`[UDP] Recebido de ${rinfo.address}:${rinfo.port}:`, data);

    // Mapeamento dinâmico e seguro para o esquema InfluxDB
    const estado_robo = data.estado_fsm || data.estado_robo || 'IDLE';
    const id_labirinto = data.id_labirinto || 'default';
    const id_corrida = data.id_corrida || 'default';
    const objetivo = data.objetivo || 'N';

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
        console.log(`[InfluxDB] Ponto gravado com sucesso no bucket: ${config.INFLUX_BUCKET}`);
      })
      .catch((err) => {
        console.error('[InfluxDB] Erro ao gravar ponto:', err.message);
      });

  } catch (err) {
    console.error('[UDP] Erro ao processar mensagem ou decodificar MsgPack:', err.message);
  }
}
