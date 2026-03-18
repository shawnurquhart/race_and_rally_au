import type { Product, ProductFilters } from '@/types/product';

export interface ProductRepository {
  list(filters?: ProductFilters): Promise<Product[]>;
  upsert(product: Product): Promise<void>;
  upsertMany(products: Product[]): Promise<void>;
  remove(productId: string): Promise<void>;
  clear(): Promise<void>;
}
