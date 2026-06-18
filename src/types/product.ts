export const PIAA_CATEGORIES = [
  'PIAA CUBE and ROUND',
  'PIAA LED LIGHT BAR',
  'PIAA ROUND LED',
  'PIAA RALLY - MOTORSPORT',
  'PIAA LED BULBS',
  'PIAA HORNS',
  'Wiper Blades',
  'PIAA MAGNETIC OIL FILTER',
  'PIAA RADIATOR CAP (MOTORSPORT)',
] as const;

export const WIPER_SUBCATEGORIES = [
  'Si-Tech WIPER BLADES - Si-tech - Silicon',
  'SLIMVOGUE WIPER BLADES - Silicon',
] as const;

export type PiaaCategory = (typeof PIAA_CATEGORIES)[number];

export type ProductBrand = 'piaa';

export interface Product {
  id: string;
  brand: ProductBrand;
  category: PiaaCategory;
  subCategory?: string;
  folderName?: string;
  name: string;
  sku: string;
  description: string;
  price: number | null;
  unitsPerPackage?: number | null;
  imageReference: string;
  galleryImageReferences?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  brand?: ProductBrand;
  category?: PiaaCategory;
  isActive?: boolean;
}
