import { proxyActivities } from '@temporalio/workflow';
import type * as supplierActivities from '../activities/supplier.activities';
import type * as cacheActivities from '../activities/cache.activities';
import { AggregationResult, HotelOffer, SupplierResult } from '../types/hotel';

const suppliers = proxyActivities<typeof supplierActivities>({
  startToCloseTimeout: '10 seconds',
  retry: { maximumAttempts: 2, initialInterval: '1 second', backoffCoefficient: 2 }
});
const cache = proxyActivities<typeof cacheActivities>({
  startToCloseTimeout: '10 seconds',
  retry: { maximumAttempts: 3, initialInterval: '1 second' }
});

function chooseBestOffer(results: SupplierResult[]): HotelOffer[] {
  const byHotel = new Map<string, HotelOffer>();
  for (const result of results) {
    for (const offer of result.offers) {
      const key = offer.hotelName.trim().toLowerCase();
      const current = byHotel.get(key);
      if (!current || offer.price < current.price ||
        (offer.price === current.price && offer.commissionRate > current.commissionRate)) {
        byHotel.set(key, offer);
      }
    }
  }
  return [...byHotel.values()].sort((a, b) => a.price - b.price || a.hotelName.localeCompare(b.hotelName));
}

export async function aggregateHotelOffers(city: string): Promise<AggregationResult> {
  const [supplierA, supplierB] = await Promise.all([
    suppliers.fetchSupplierA(city),
    suppliers.fetchSupplierB(city)
  ]);
  const results = [supplierA, supplierB];
  const healthy = results.filter(result => !result.error);
  const degradedSuppliers = results.filter(result => result.error).map(result => result.supplier);

  if (healthy.length === 0) {
    throw new Error('Both hotel suppliers failed');
  }

  const offers = chooseBestOffer(healthy);
  await cache.cacheOffers(city, offers);
  return { city, offers, degradedSuppliers, generatedAt: new Date().toISOString() };
}
