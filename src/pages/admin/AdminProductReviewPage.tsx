import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { productService } from '@/services/productService';
import { imageAssetService } from '@/services/imageAssetService';
import type { Product } from '@/types/product';

const currency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
});

const AdminProductReviewPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const nextProducts = await productService.list({ brand: 'piaa' });
    setProducts(nextProducts);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const onDelete = useCallback(
    async (id: string) => {
      await productService.remove(id);
      await loadProducts();
    },
    [loadProducts],
  );

  const grouped = useMemo(() => {
    const byCategory: Record<string, Product[]> = {};
    products.forEach((product) => {
      if (!byCategory[product.category]) {
        byCategory[product.category] = [];
      }
      byCategory[product.category].push(product);
    });
    return byCategory;
  }, [products]);

  return (
    <AdminLayout title="Product Review">
      <div className="mb-4 text-sm text-gray-400">
        Review imported PIAA products. Images are resolved using filename matching from uploaded image files.
      </div>

      {loading && <p className="text-gray-400">Loading products...</p>}

      {!loading && products.length === 0 && (
        <div className="border border-gray-800 bg-gray-950 p-6 text-gray-400">No products imported yet.</div>
      )}

      {!loading &&
        Object.entries(grouped).map(([category, categoryProducts]) => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-heading font-bold mb-3">{category}</h2>
            <div className="space-y-3">
              {categoryProducts.map((product) => {
                const resolvedImage = imageAssetService.resolveImage(product.imageReference);
                return (
                  <div key={product.id} className="border border-gray-800 bg-gray-950 p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-heading text-xl mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-400 mb-2">SKU: {product.sku || 'N/A'}</p>
                        <p className="text-gray-300 text-sm mb-2">{product.description || 'No description'}</p>
                        <p className="text-motorsport-yellow text-sm">
                          {product.price === null ? 'Price not set' : currency.format(product.price)}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Image reference: {product.imageReference || 'N/A'}
                        </p>
                      </div>

                      <div className="w-full md:w-48">
                        {resolvedImage ? (
                          <img
                            src={resolvedImage}
                            alt={product.name}
                            className="w-full h-32 object-cover border border-gray-800 mb-2"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-500 text-xs mb-2">
                            No image match
                          </div>
                        )}
                        <button
                          className="w-full border border-red-700 text-red-300 px-3 py-2 text-sm hover:bg-red-900/30"
                          onClick={() => void onDelete(product.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
    </AdminLayout>
  );
};

export default AdminProductReviewPage;
