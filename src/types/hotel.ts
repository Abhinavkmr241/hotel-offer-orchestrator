export interface SupplierOffer {
  hotelName: string;
  city: string;
  price: number;
  commissionRate: number;
  supplier: 'A' | 'B';
  currency: string;
}

export interface HotelOffer extends SupplierOffer {}

export interface SupplierResult {
  supplier: 'A' | 'B';
  offers: SupplierOffer[];
  error?: string;
}

export interface AggregationResult {
  city: string;
  offers: HotelOffer[];
  degradedSuppliers: string[];
  generatedAt: string;
}
