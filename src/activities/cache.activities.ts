import { redis, cityKeys } from '../services/redis';
import { HotelOffer } from '../types/hotel';
import { config } from '../config/env';

export async function cacheOffers(city: string, offers: HotelOffer[]): Promise<void> {
  const keys = cityKeys(city);
  const pipeline = redis.pipeline();
  pipeline.del(keys.sorted, keys.hash);
  for (const offer of offers) {
    const member = offer.hotelName.toLowerCase();
    pipeline.zadd(keys.sorted, offer.price, member);
    pipeline.hset(keys.hash, member, JSON.stringify(offer));
  }
  pipeline.expire(keys.sorted, config.cacheTtlSeconds);
  pipeline.expire(keys.hash, config.cacheTtlSeconds);
  const result = await pipeline.exec();
  if (!result) throw new Error('Redis cache pipeline did not execute');
  const failed = result.find(([error]) => error);
  if (failed?.[0]) throw failed[0];
}

export async function getOffersByPrice(city: string, minPrice: number, maxPrice: number): Promise<HotelOffer[]> {
  const keys = cityKeys(city);
  const members = await redis.zrangebyscore(keys.sorted, minPrice, maxPrice);
  if (!members.length) return [];
  const values = await redis.hmget(keys.hash, ...members);
  return values.filter((value): value is string => value !== null).map(value => JSON.parse(value) as HotelOffer);
}

export async function getCachedOffers(city: string): Promise<HotelOffer[]> {
  const keys = cityKeys(city);
  const members = await redis.zrange(keys.sorted, 0, -1);
  if (!members.length) return [];
  const values = await redis.hmget(keys.hash, ...members);
  return values.filter((value): value is string => value !== null).map(value => JSON.parse(value) as HotelOffer);
}
