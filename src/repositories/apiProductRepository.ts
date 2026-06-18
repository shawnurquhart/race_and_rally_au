import type { Product, ProductFilters } from '@/types/product';
import type { ProductRepository } from './productRepository';

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
  async list(filters?: ProductFilters): Promise<Product[]> {
    const res = await fetch(`${API_BASE}/products.php${buildQuery(filters)}`);
    if (!res.ok) throw new Error(`API list failed: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.products) ? (data.products as Product[]) : [];
  }

  async upsert(product: Product): Promise<void> {
    await this.upsertMany([product]);
  }

  async upsertMany(products: Product[]): Promise<void> {
    const res = await fetch(`${API_BASE}/products.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsertMany', products }),
    });
    if (!res.ok) throw new Error(`API upsertMany failed: ${res.status}`);
  }

  async remove(productId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/products.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', productId }),
    });
    if (!res.ok) throw new Error(`API remove failed: ${res.status}`);
  }

  async clear(): Promise<void> {
    const res = await fetch(`${API_BASE}/products.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear' }),
    });
    if (!res.ok) throw new Error(`API clear failed: ${res.status}`);
  }
}
