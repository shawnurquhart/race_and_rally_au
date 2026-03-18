import type { Product, ProductFilters } from '@/types/product';
import type { ProductRepository } from './productRepository';

const STORAGE_KEY = 'rra_dev_products_v1';

const readProducts = (): Product[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Product[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeProducts = (products: Product[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

const matchesFilters = (product: Product, filters?: ProductFilters): boolean => {
  if (!filters) {
    return true;
  }

  if (filters.brand && product.brand !== filters.brand) {
    return false;
  }

  if (filters.category && product.category !== filters.category) {
    return false;
  }

  if (typeof filters.isActive === 'boolean' && product.isActive !== filters.isActive) {
    return false;
  }

  return true;
};

export class LocalProductRepository implements ProductRepository {
  async list(filters?: ProductFilters): Promise<Product[]> {
    return readProducts()
      .filter((product) => matchesFilters(product, filters))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async upsert(product: Product): Promise<void> {
    const products = readProducts();
    const index = products.findIndex((item) => item.id === product.id);

    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }

    writeProducts(products);
  }

  async upsertMany(productsToUpsert: Product[]): Promise<void> {
    const existing = readProducts();
    const byId = new Map(existing.map((product) => [product.id, product]));

    productsToUpsert.forEach((product) => {
      byId.set(product.id, product);
    });

    writeProducts(Array.from(byId.values()));
  }

  async remove(productId: string): Promise<void> {
    const products = readProducts().filter((product) => product.id !== productId);
    writeProducts(products);
  }

  async clear(): Promise<void> {
    writeProducts([]);
  }
}
