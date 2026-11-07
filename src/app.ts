import express from 'express';
import cors from 'cors';
import { hotelsRouter } from './routes/hotels.routes';
import { supplierRouter } from './suppliers/router';
import { config } from './config/env';
import { redis } from './services/redis';

export const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', async (_req, res) => {
  const checkSupplier = async (path: string, shouldFail: boolean) => {
    try {
      const failureParam = shouldFail ? '&fail=true' : '';
      const response = await fetch(`http://127.0.0.1:${config.port}${path}?city=Delhi${failureParam}`, { signal: AbortSignal.timeout(1000) });
      return response.ok ? 'healthy' : 'unhealthy';
    } catch { return 'unhealthy'; }
  };
  const [supplierA, supplierB, redisStatus] = await Promise.all([
    checkSupplier('/supplierA/hotels', config.supplierAFail), checkSupplier('/supplierB/hotels', config.supplierBFail),
    redis.ping().then(() => 'healthy').catch(() => 'unhealthy')
  ]);
  const healthy = supplierA === 'healthy' && supplierB === 'healthy' && redisStatus === 'healthy';
  return res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded', service: 'hotel-offer-api',
    suppliers: { A: supplierA, B: supplierB }, redis: redisStatus,
    timestamp: new Date().toISOString()
  });
});
app.use('/api', hotelsRouter);
app.use('/', supplierRouter);
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
