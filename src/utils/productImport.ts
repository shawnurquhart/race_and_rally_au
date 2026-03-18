import type { PiaaCategory, Product } from '@/types/product';

export const PRODUCT_IMPORT_FIELDS = [
  'name',
  'sku',
  'description',
  'price',
  'imageReference',
] as const;

export type ProductImportField = (typeof PRODUCT_IMPORT_FIELDS)[number];

export type ProductImportMapping = Record<ProductImportField, string | null>;

const parsePrice = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const safeValue = (value: string | undefined): string => (value ?? '').trim();

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `dev-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

export const buildProductsFromMappedRows = (
  rows: Record<string, string>[],
  mapping: ProductImportMapping,
  category: PiaaCategory,
): Product[] => {
  const now = new Date().toISOString();

  return rows
    .map((row): Product | null => {
      const read = (field: ProductImportField): string => {
        const column = mapping[field];
        if (!column) {
          return '';
        }

        return safeValue(row[column]);
      };

      const name = read('name');
      const sku = read('sku');

      if (!name) {
        return null;
      }

      const product: Product = {
        id: makeId(),
        brand: 'piaa',
        category,
        name,
        sku,
        description: read('description'),
        price: parsePrice(read('price')),
        imageReference: read('imageReference'),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      return product;
    })
    .filter((product): product is Product => product !== null);
};

export const defaultMappingFromHeaders = (headers: string[]): ProductImportMapping => {
  const normalized = headers.map((header) => ({
    original: header,
    value: header.trim().toLowerCase(),
  }));

  const pick = (patterns: string[]): string | null => {
    const found = normalized.find((item) => patterns.some((pattern) => item.value.includes(pattern)));
    return found?.original ?? null;
  };

  return {
    name: pick(['name', 'product']),
    sku: pick(['sku', 'code', 'part']),
    description: pick(['description', 'details']),
    price: pick(['price', 'rrp', 'cost']),
    imageReference: pick(['image', 'photo', 'filename']),
  };
};
