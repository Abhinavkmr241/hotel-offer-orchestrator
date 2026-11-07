import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3000),
  temporalAddress: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
  temporalNamespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
  taskQueue: process.env.TEMPORAL_TASK_QUEUE ?? 'hotel-offer-task-queue',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  supplierTimeoutMs: Number(process.env.SUPPLIER_TIMEOUT_MS ?? 2500),
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS ?? 900),
  supplierAFail: process.env.SUPPLIER_A_FAIL === 'true',
  supplierBFail: process.env.SUPPLIER_B_FAIL === 'true'
};
