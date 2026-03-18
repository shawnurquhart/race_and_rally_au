export const PIAA_CATEGORIES = ['Lights', 'Globes', 'Other Products'] as const;

export type PiaaCategory = (typeof PIAA_CATEGORIES)[number];

export type ProductBrand = 'piaa';

export interface Product {
  id: string;
  brand: ProductBrand;
  category: PiaaCategory;
  folderName?: string;
  name: string;
  sku: string;
  description: string;
  price: number | null;
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
