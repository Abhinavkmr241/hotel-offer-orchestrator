import Redis from 'ioredis';
import { config } from '../config/env';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: attempt => Math.min(attempt * 200, 2000)
});

redis.on('error', error => console.error('[redis] connection error:', error.message));

export function cityKeys(city: string) {
  const normalized = city.trim().toLowerCase();
  return { sorted: `hotels:${normalized}:prices`, hash: `hotels:${normalized}:offers` };
}
