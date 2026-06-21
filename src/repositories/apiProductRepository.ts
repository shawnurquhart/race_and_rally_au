import type { Product, ProductFilters } from '@/types/product';
import type { ProductRepository } from './productRepository';
import { LocalProductRepository } from './localProductRepository';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/assets/backend/api';

const buildQuery = (filters?: ProductFilters): string => {
  const params = new URLSearchParams();
  if (filters?.brand) params.set('brand', filters.brand);
  if (filters?.category) params.set('category', filters.category);
  if (typeof filters?.isActive === 'boolean') params.set('isActive', String(filters.isActive));
  const q = params.toString();
  return q ? `?${q}` : '';
};

export class ApiProductRepository implements ProductRepository {
  private readonly localFallback = new LocalProductRepository();

  async list(filters?: ProductFilters): Promise<Product[]> {
    try {
      const res = await fetch(`${API_BASE}/products.php${buildQuery(filters)}`);
      const contentType = res.headers.get('content-type') ?? '';
      if (!res.ok) throw new Error(`API list failed: ${res.status}`);
      if (!contentType.includes('application/json')) {
        throw new Error(`API list returned ${contentType || 'non-JSON response'}`);
      }

      const data = await res.json();
      return Array.isArray(data.products) ? (data.products as Product[]) : [];
    } catch (error) {
      console.warn('Remote product API unavailable; using local product store fallback.', error);
      return this.localFallback.list(filters);
    }
  }

  async upsert(product: Product): Promise<void> {
    await this.upsertMany([product]);
  }

  async upsertMany(products: Product[]): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/products.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upsertMany', products }),
      });
      if (!res.ok) throw new Error(`API upsertMany failed: ${res.status}`);
    } catch (error) {
      console.warn('Remote product API unavailable; saving to local product store fallback.', error);
      await this.localFallback.upsertMany(products);
    }
  }

  async remove(productId: string): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/products.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', productId }),
      });
      if (!res.ok) throw new Error(`API remove failed: ${res.status}`);
    } catch (error) {
      console.warn('Remote product API unavailable; removing from local product store fallback.', error);
      await this.localFallback.remove(productId);
    }
  }

  async clear(): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/products.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });
      if (!res.ok) throw new Error(`API clear failed: ${res.status}`);
    } catch (error) {
      console.warn('Remote product API unavailable; clearing local product store fallback.', error);
      await this.localFallback.clear();
    }
  }
}
