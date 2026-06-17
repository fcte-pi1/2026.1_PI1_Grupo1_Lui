import { InfluxDB } from '@influxdata/influxdb-client';
import config from '../config/env.js';

// Inicializa cliente InfluxDB
const influxDB = new InfluxDB({ url: config.INFLUX_URL, token: config.INFLUX_TOKEN });
const writeApi = influxDB.getWriteApi(config.INFLUX_ORG, config.INFLUX_BUCKET, 'ns');

export { writeApi };
