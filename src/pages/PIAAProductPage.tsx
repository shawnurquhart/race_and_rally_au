import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react';
import { productService } from '@/services/productService';
import { imageAssetService } from '@/services/imageAssetService';
import { adminSettingsService } from '@/services/adminSettingsService';
import { useAdminAuth } from '@/auth/AdminAuthContext';
import type { PiaaCategory, Product } from '@/types/product';
import { CART_UPDATED_EVENT, cartService } from '@/services/cartService';

const getImageDirectory = (reference: string): string => {
  const parts = reference.split('/').filter(Boolean);
  if (parts.length <= 1) {
    return '';
  }

  return parts.slice(0, -1).join('/');
};

const PIAAProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [settings, setSettings] = useState(() => adminSettingsService.get());
  const [selectedImageReference, setSelectedImageReference] = useState('');
  const [cartQuantity, setCartQuantity] = useState(0);

  const catalogPath = location.pathname.startsWith('/brands/piaa/catalog')
    ? '/brands/piaa/catalog'
    : '/brands/piaa';

  const loadProduct = async () => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const loaded = await productService.getById(productId);
    setProduct(loaded);
    setSettings(adminSettingsService.get());
    setSelectedImageReference(loaded?.imageReference ?? '');
    setLoading(false);
  };

  useEffect(() => {
    void loadProduct();
  }, [productId]);

  useEffect(() => {
    const syncCartQuantity = () => {
      if (!productId) {
        setCartQuantity(0);
        return;
      }

      setCartQuantity(cartService.getItemQuantity(productId));
    };

    syncCartQuantity();
    window.addEventListener(CART_UPDATED_EVENT, syncCartQuantity);
    window.addEventListener('storage', syncCartQuantity);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCartQuantity);
      window.removeEventListener('storage', syncCartQuantity);
    };
  }, [productId]);

  const galleryReferences = useMemo(() => {
    if (!product) {
      return [];
    }

    const values = [product.imageReference, ...(product.galleryImageReferences ?? [])].filter(Boolean);
    return Array.from(new Set(values));
  }, [product]);

  const activeReference = selectedImageReference || galleryReferences[0] || '';
  const activeImage = imageAssetService.resolveImage(activeReference);

  const onSave = async () => {
    if (!product) {
      return;
    }

    await productService.upsert({
      ...product,
      updatedAt: new Date().toISOString(),
    });

    setMessage('Product details saved.');
    await loadProduct();
  };

  const setProductQuantity = (quantity: number) => {
    if (!product) {
      return;
    }

    cartService.setProductQuantity(product, quantity);
    setCartQuantity(cartService.getItemQuantity(product.id));
  };

  const onAdditionalImagesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!product) {
      return;
    }

    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/'));
    if (files.length === 0) {
      return;
    }

    const basePath = getImageDirectory(product.imageReference);
    const references = files.map((file) => ({
      file,
      reference: `${basePath ? `${basePath}/` : ''}${file.name}`,
    }));

    const storedReferences = await imageAssetService.storeFilesWithReferences(references, {
      maxImageSizeKb: settings.maxImageSizeKb,
    });

    const nextGallery = Array.from(new Set([...(product.galleryImageReferences ?? []), ...storedReferences]));

    await productService.upsert({
      ...product,
      galleryImageReferences: nextGallery,
      updatedAt: new Date().toISOString(),
    });

    setMessage(`${storedReferences.length} additional image(s) uploaded.`);
    await loadProduct();
  };

  if (loading) {
    return <div className="section-padding container-narrow px-4 md:px-6 text-gray-400">Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="section-padding container-narrow px-4 md:px-6">
        <p className="text-gray-300 mb-4">Product not found.</p>
        <Link to={catalogPath} className="text-motorsport-yellow hover:underline">
          Return to PIAA products
        </Link>
      </div>
    );
  }

  return (
    <section className="section-padding bg-black min-h-screen">
      <div className="container-narrow px-4 md:px-6">
        <Link to={catalogPath} className="inline-flex items-center text-motorsport-yellow mb-8 hover:underline">
          <ArrowLeft size={20} className="mr-2" />
          Back to PIAA products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
          <div>
            {activeImage ? (
              <img
                src={activeImage}
                alt={product.name}
                className="object-cover border border-gray-800 bg-black"
                style={{ width: settings.productDetailDisplaySizePx, height: settings.productDetailDisplaySizePx, maxWidth: '100%' }}
              />
            ) : (
              <div
                className="border border-gray-800 bg-gray-900 text-gray-500 flex items-center justify-center"
                style={{ width: settings.productDetailDisplaySizePx, height: settings.productDetailDisplaySizePx, maxWidth: '100%' }}
              >
                No image
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              {galleryReferences.map((reference) => {
                const thumb = imageAssetService.resolveImage(reference);
                if (!thumb) {
                  return null;
                }

                return (
                  <button
                    key={reference}
                    onClick={() => setSelectedImageReference(reference)}
                    className={`border ${activeReference === reference ? 'border-motorsport-yellow' : 'border-gray-700'}`}
                  >
                    <img src={thumb} alt={product.name} className="w-16 h-16 object-cover" />
                  </button>
                );
              })}
            </div>

            {isAuthenticated && (
              <div className="mt-5">
                <input
                  id="additional-product-images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(event) => void onAdditionalImagesSelected(event)}
                  className="sr-only"
                />
                <label
                  htmlFor="additional-product-images"
                  className="inline-flex items-center cursor-pointer rounded border border-motorsport-yellow bg-motorsport-yellow/10 px-4 py-2 text-sm font-semibold text-motorsport-yellow hover:bg-motorsport-yellow/20 transition-colors"
                >
                  Upload additional images
                </label>
              </div>
            )}

            {!isAuthenticated && product && (
              <div className="mt-5 border border-gray-800 bg-gray-950 p-4">
                <label className="flex items-center gap-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={cartQuantity > 0}
                    onChange={(event) => setProductQuantity(event.target.checked ? Math.max(1, cartQuantity) : 0)}
                  />
                  Add to cart
                </label>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-400">Quantity</span>
                  <div className="inline-flex items-center border border-gray-700">
                    <button
                      type="button"
                      className="px-2 py-1 text-gray-200 hover:bg-gray-800"
                      onClick={() => setProductQuantity(Math.max(0, cartQuantity - 1))}
                      aria-label={`Decrease quantity for ${product.name}`}
                    >
                      <ChevronDown size={14} />
                    </button>
                    <span className="min-w-10 text-center text-sm">{cartQuantity}</span>
                    <button
                      type="button"
                      className="px-2 py-1 text-gray-200 hover:bg-gray-800"
                      onClick={() => setProductQuantity(cartQuantity + 1)}
                      aria-label={`Increase quantity for ${product.name}`}
                    >
                      <ChevronUp size={14} />
                    </button>
                  </div>
                </div>

                <button className="btn-primary mt-4 w-full inline-flex items-center justify-center gap-2" onClick={() => navigate('/cart')}>
                  <ShoppingCart size={18} />
                  Go to Cart
                </button>
              </div>
            )}
          </div>

          <div className="border border-gray-800 bg-gray-950 p-5">
            {isAuthenticated ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Product name</label>
                  <input
                    className="w-full bg-black border border-gray-700 px-3 py-2"
                    value={product.name}
                    onChange={(event) => setProduct({ ...product, name: event.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">SKU</label>
                  <input
                    className="w-full bg-black border border-gray-700 px-3 py-2"
                    value={product.sku}
                    onChange={(event) => setProduct({ ...product, sku: event.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Category</label>
                  <select
                    className="w-full bg-black border border-gray-700 px-3 py-2"
                    value={product.category}
                    onChange={(event) => setProduct({ ...product, category: event.target.value as PiaaCategory })}
                  >
                    <option>Lights</option>
                    <option>Globes</option>
                    <option>Other Products</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Folder</label>
                  <input
                    className="w-full bg-black border border-gray-700 px-3 py-2"
                    value={product.folderName ?? ''}
                    onChange={(event) => setProduct({ ...product, folderName: event.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Description</label>
                  <textarea
                    className="w-full bg-black border border-gray-700 px-3 py-2"
                    value={product.description}
                    rows={4}
                    onChange={(event) => setProduct({ ...product, description: event.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Price (AUD)</label>
                  <input
                    className="w-full bg-black border border-gray-700 px-3 py-2"
                    type="number"
                    step="0.01"
                    value={product.price ?? ''}
                    onChange={(event) => {
                      const raw = event.target.value;
                      setProduct({
                        ...product,
                        price: raw === '' ? null : Number(raw),
                      });
                    }}
                  />
                </div>

                <button className="btn-primary" onClick={() => void onSave()}>
                  Save Product
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-heading font-bold mb-2">{product.name}</h1>
                <p className="text-sm text-gray-500 mb-3">SKU: {product.sku || 'N/A'}</p>
                <p className="text-gray-300 mb-4">{product.description || 'Product description here...'}</p>
                <p className="text-motorsport-yellow font-semibold text-xl">
                  {product.price === null
                    ? 'Price on request'
                    : new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(product.price)}
                </p>
              </>
            )}

            {message && <p className="text-sm text-gray-300 mt-4">{message}</p>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PIAAProductPage;
