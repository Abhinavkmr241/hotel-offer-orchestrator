import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { Connection, Client } from '@temporalio/client';
import { config } from '../config/env';
import { getCachedOffers, getOffersByPrice } from '../activities/cache.activities';
import type { AggregationResult } from '../types/hotel';

export const hotelsRouter = Router();
const citySchema = z.string().trim().min(1).max(80);
const priceSchema = z.coerce.number().finite().nonnegative();

async function runAggregation(city: string) {
  const connection = await Connection.connect({ address: config.temporalAddress });
  const client = new Client({ connection, namespace: config.temporalNamespace });
  try {
    const handle = await client.workflow.start('aggregateHotelOffers', {
      taskQueue: config.taskQueue,
      workflowId: `hotel-aggregation-${city.toLowerCase()}-${randomUUID()}`,
      args: [city],
      workflowExecutionTimeout: '45 seconds'
    });
    return await handle.result() as AggregationResult;
  } finally {
    await connection.close();
  }
}

hotelsRouter.get('/hotels', async (req: Request, res: Response) => {
  const parsed = citySchema.safeParse(req.query.city);
  if (!parsed.success) return res.status(400).json({ error: 'A valid city query parameter is required' });
  if (req.query.minPrice !== undefined || req.query.maxPrice !== undefined) {
    const min = priceSchema.safeParse(req.query.minPrice);
    const max = priceSchema.safeParse(req.query.maxPrice);
    if (!min.success || !max.success || min.data > max.data) {
      return res.status(400).json({ error: 'Provide valid minPrice and maxPrice; prices must be non-negative and minPrice <= maxPrice' });
    }
    try {
      return res.json(await getOffersByPrice(parsed.data, min.data, max.data));
    } catch (error) {
      return res.status(503).json({ error: 'Unable to query cached hotel offers', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
  let cacheAvailable = true;
  try {
    const cached = await getCachedOffers(parsed.data);
    if (cached.length > 0) {
      res.setHeader('x-cache', 'HIT');
      return res.json(cached);
    }
  } catch (cacheError) {
    cacheAvailable = false;
    console.warn('[hotels] Redis cache read failed; bypassing cache:', cacheError instanceof Error ? cacheError.message : cacheError);
  }

  res.setHeader('x-cache', cacheAvailable ? 'MISS' : 'BYPASS');

  try {
    const result = await runAggregation(parsed.data);
    if (result.degradedSuppliers.length) {
      res.setHeader('x-degraded-suppliers', result.degradedSuppliers.join(','));
    }
    return res.json(result.offers);
  } catch (error) {
    try {
      const cached = await getCachedOffers(parsed.data);
      if (cached.length) {
        res.setHeader('x-cache', 'FALLBACK');
        res.setHeader('x-cache-fallback', 'true');
        res.setHeader('x-degraded-suppliers', 'A,B');
        return res.json(cached);
      }
    } catch { }
    return res.status(503).json({ error: 'Unable to retrieve hotel offers', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

hotelsRouter.get('/hotels/price-range', async (req: Request, res: Response) => {
  const city = citySchema.safeParse(req.query.city);
  const min = priceSchema.safeParse(req.query.minPrice);
  const max = priceSchema.safeParse(req.query.maxPrice);
  if (!city.success || !min.success || !max.success || min.data > max.data) {
    return res.status(400).json({ error: 'Provide city, minPrice and maxPrice; prices must be non-negative and minPrice <= maxPrice' });
  }
  try {
    const offers = await getOffersByPrice(city.data, min.data, max.data);
    return res.json(offers);
  } catch (error) {
    return res.status(503).json({ error: 'Unable to query cached hotel offers', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});
