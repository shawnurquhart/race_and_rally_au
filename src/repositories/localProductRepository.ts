import type { Product, ProductFilters } from '@/types/product';
import type { ProductRepository } from './productRepository';

const STORAGE_KEY = 'rra_dev_products_v1';

const normalizeSkuKey = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const firstToken = trimmed.split(/\s+/)[0] ?? '';
  return firstToken.trim().toLowerCase();
};

const isValidPiaaSku = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  const noSpaces = !/\s/.test(trimmed);
  const hasAllowedChars = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(trimmed);
  const hasDigit = /\d/.test(trimmed);
  const hasLetter = /[A-Za-z]/.test(trimmed);

  return noSpaces && hasAllowedChars && hasDigit && hasLetter;
};

const dedupeProducts = (products: Product[]): Product[] => {
  const byCompositeKey = new Map<string, Product>();

  for (const product of products) {
    const skuKey = normalizeSkuKey(product.sku);
    if (product.brand === 'piaa' && !isValidPiaaSku(skuKey.toUpperCase())) {
      continue;
    }

    const compositeKey = `${product.brand}::${skuKey || product.id}`;
    const existing = byCompositeKey.get(compositeKey);

    const candidate: Product = {
      ...product,
      sku: skuKey ? (product.sku.trim().split(/\s+/)[0] ?? product.sku).trim() : product.sku,
    };

    if (!existing) {
      byCompositeKey.set(compositeKey, candidate);
      continue;
    }

    const existingUpdated = Date.parse(existing.updatedAt || '') || 0;
    const candidateUpdated = Date.parse(candidate.updatedAt || '') || 0;
    if (candidateUpdated >= existingUpdated) {
      byCompositeKey.set(compositeKey, candidate);
    }
  }

  return Array.from(byCompositeKey.values());
};

const readProducts = (): Product[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Product[];
    return Array.isArray(parsed) ? dedupeProducts(parsed) : [];
  } catch {
    return [];
  }
};

const writeProducts = (products: Product[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dedupeProducts(products)));
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
    const byCompositeKey = new Map<string, Product>(
      existing.map((product): [string, Product] => {
        const skuKey = normalizeSkuKey(product.sku);
        return [`${product.brand}::${skuKey || product.id}`, product];
      }),
    );

    productsToUpsert.forEach((product) => {
      const skuKey = normalizeSkuKey(product.sku);
      const key = `${product.brand}::${skuKey || product.id}`;
      const existingMatch = byCompositeKey.get(key);

      if (existingMatch) {
        byCompositeKey.set(key, {
          ...existingMatch,
          ...product,
          id: existingMatch.id,
          sku: skuKey ? (product.sku.trim().split(/\s+/)[0] ?? product.sku).trim() : product.sku,
          imageReference: product.imageReference || existingMatch.imageReference,
          galleryImageReferences:
            product.galleryImageReferences && product.galleryImageReferences.length > 0
              ? product.galleryImageReferences
              : existingMatch.galleryImageReferences,
          folderName: product.folderName || existingMatch.folderName,
        });
      } else {
        byCompositeKey.set(key, {
          ...product,
          sku: skuKey ? (product.sku.trim().split(/\s+/)[0] ?? product.sku).trim() : product.sku,
        });
      }
    });

    writeProducts(Array.from(byCompositeKey.values()));
  }

  async remove(productId: string): Promise<void> {
    const products = readProducts().filter((product) => product.id !== productId);
    writeProducts(products);
  }

  async clear(): Promise<void> {
    writeProducts([]);
  }
}
