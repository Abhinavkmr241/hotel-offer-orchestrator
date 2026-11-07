import { SupplierOffer, SupplierResult } from '../types/hotel';
import { config } from '../config/env';

async function requestSupplier(supplier: 'A' | 'B', city: string): Promise<SupplierResult> {
  const shouldFail = supplier === 'A' ? config.supplierAFail : config.supplierBFail;
  const endpoint = supplier === 'A' ? 'http://api:3000/supplierA/hotels' : 'http://api:3000/supplierB/hotels';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.supplierTimeoutMs);
  try {
    const response = await fetch(`${endpoint}?city=${encodeURIComponent(city)}${shouldFail ? '&fail=true' : ''}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const offers = await response.json() as SupplierOffer[];
    return { supplier, offers };
  } catch (error) {
    return { supplier, offers: [], error: error instanceof Error ? error.message : 'Unknown supplier error' };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSupplierA(city: string): Promise<SupplierResult> {
  return requestSupplier('A', city);
}

export async function fetchSupplierB(city: string): Promise<SupplierResult> {
  return requestSupplier('B', city);
}
