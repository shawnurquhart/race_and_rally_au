import type { Product, ProductBrand, ProductFilters } from '@/types/product';
import { PIAA_CATEGORIES } from '@/types/product';
import { LocalProductRepository } from '@/repositories/localProductRepository';
import type { ProductRepository } from '@/repositories/productRepository';

export interface ProductGroup {
  category: string;
  products: Product[];
}

class ProductService {
  private readonly repository: ProductRepository;

  constructor(repository: ProductRepository) {
    this.repository = repository;
  }

  async list(filters?: ProductFilters): Promise<Product[]> {
    return this.repository.list(filters);
  }

  async getById(productId: string): Promise<Product | null> {
    const products = await this.repository.list();
    return products.find((product) => product.id === productId) ?? null;
  }

  async listByBrandGrouped(brand: ProductBrand): Promise<ProductGroup[]> {
    const products = await this.repository.list({ brand, isActive: true });

    if (brand === 'piaa') {
      return PIAA_CATEGORIES.map((category) => ({
        category,
        products: products.filter((product) => product.category === category),
      }));
    }

    return [];
  }

  async upsert(product: Product): Promise<void> {
    await this.repository.upsert(product);
  }

  async upsertMany(products: Product[]): Promise<void> {
    await this.repository.upsertMany(products);
  }

  async remove(productId: string): Promise<void> {
    await this.repository.remove(productId);
  }

  async clear(): Promise<void> {
    await this.repository.clear();
  }
}

export const productService = new ProductService(new LocalProductRepository());
