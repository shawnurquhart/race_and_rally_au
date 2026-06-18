import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ShoppingCart, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '@/services/productService';
import { imageAssetService } from '@/services/imageAssetService';
import { PIAA_CATEGORIES, WIPER_SUBCATEGORIES } from '@/types/product';
import type { PiaaCategory, Product } from '@/types/product';
import { adminSettingsService } from '@/services/adminSettingsService';
import { useAdminAuth } from '@/auth/AdminAuthContext';
import { CART_UPDATED_EVENT, cartService } from '@/services/cartService';
import PIAASubNav from '@/components/piaa/PIAASubNav';

const PIAACatalogPage: React.FC = () => {
  const { isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeSection, setActiveSection] = useState<PiaaCategory>(PIAA_CATEGORIES[0]);
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [cartItemCount, setCartItemCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(() => adminSettingsService.get());
  const [modalProductId, setModalProductId] = useState<string | null>(null);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const fallbackImage = imageAssetService.getFallbackImagePath();

  const syncCartState = () => {
    const cart = cartService.getCart();
    setCartItemCount(cart.items.reduce((sum, item) => sum + item.quantity, 0));
    setCartQuantities(
      cart.items.reduce<Record<string, number>>((next, item) => {
        next[item.productId] = item.quantity;
        return next;
      }, {}),
    );
  };

  const load = async () => {
    setLoading(true);
    const loaded = await productService.list({ brand: 'piaa', isActive: true });
    setProducts(loaded);
    setSettings(adminSettingsService.get());
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    syncCartState();

    const onCartUpdated = () => syncCartState();
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === 'rra_cart_v1') {
        syncCartState();
      }
    };

    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const groupedProducts = useMemo(
    () =>
      PIAA_CATEGORIES.map((category) => ({
        category,
        products: products.filter((product) => product.category === category),
      })),
    [products],
  );

  const activeProducts = groupedProducts.find((group) => group.category === activeSection)?.products ?? [];

  const folderNames = useMemo(() => {
    const folders = activeProducts
      .map((product) => product.folderName?.trim())
      .filter((value): value is string => Boolean(value));

    return Array.from(new Set(folders)).sort((a, b) => a.localeCompare(b));
  }, [activeProducts]);

  useEffect(() => {
    setActiveFolder('all');
  }, [activeSection]);

  const visibleProducts = useMemo(() => {
    if (activeFolder === 'all') {
      return activeProducts;
    }

    return activeProducts.filter((product) => (product.folderName || '') === activeFolder);
  }, [activeFolder, activeProducts]);

  const visibleWiperGroups = useMemo(() => {
    if (activeSection !== 'Wiper Blades') {
      return [] as Array<{ label: string; products: Product[] }>;
    }

    const groups: Array<{ label: string; products: Product[] }> = WIPER_SUBCATEGORIES.map((subCategory) => ({
      label: subCategory,
      products: visibleProducts.filter((product) => product.subCategory === subCategory),
    }));

    const ungrouped = visibleProducts.filter((product) => !product.subCategory || !WIPER_SUBCATEGORIES.includes(product.subCategory as any));
    if (ungrouped.length > 0) {
      groups.push({ label: 'Other Wiper Blades', products: ungrouped });
    }

    return groups;
  }, [activeSection, visibleProducts]);

  const formatPrice = (price: number | null): string => {
    if (price === null) {
      return 'Price on request';
    }

    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(price);
  };

  const updateProduct = async (product: Product, updates: Partial<Product>) => {
    const next: Product = {
      ...product,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await productService.upsert(next);
    await load();
  };

  const setProductQuantity = (product: Product, quantity: number) => {
    cartService.setProductQuantity(product, quantity);
    syncCartState();
  };

  const getProductQuantity = (productId: string): number => cartQuantities[productId] ?? 0;

  const openProductModal = (product: Product) => {
    const references = [product.imageReference, ...(product.galleryImageReferences ?? [])].filter(Boolean);
    if (references.length === 0) {
      return;
    }

    setModalProductId(product.id);
    setModalImageIndex(0);
  };

  const closeProductModal = () => {
    setModalProductId(null);
    setModalImageIndex(0);
  };

  const renderProductCard = (product: Product) => {
    const image = imageAssetService.resolveImage(product.imageReference);

    return (
      <div key={product.id} className="border border-gray-800 bg-black p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4">
          <div>
            <button
              type="button"
              className="inline-block"
              onClick={() => openProductModal(product)}
              aria-label={`Open larger image for ${product.name}`}
            >
              {image ? (
                <img
                  src={image}
                  alt={product.name}
                  className="object-contain border border-gray-800 bg-black"
                  style={{ width: settings.smallProductDisplaySizePx, height: settings.smallProductDisplaySizePx }}
                  onError={(event) => {
                    const img = event.currentTarget;
                    if (img.src.endsWith(fallbackImage)) return;
                    img.src = fallbackImage;
                  }}
                />
              ) : (
                <div
                  className="bg-gray-900 border border-gray-800 flex items-center justify-center text-xs text-gray-500"
                  style={{ width: settings.smallProductDisplaySizePx, height: settings.smallProductDisplaySizePx }}
                >
                  No image
                </div>
              )}
            </button>
            {image && <p className="text-xs text-motorsport-yellow mt-2">Click to enlarge</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4 items-start">
            <div>
              {isAuthenticated ? (
                <input
                  className="w-full bg-black border border-gray-700 px-3 py-2 text-xl font-heading font-bold mb-2"
                  value={product.name}
                  onChange={(event) =>
                    setProducts((previous) =>
                      previous.map((item) =>
                        item.id === product.id ? { ...item, name: event.target.value } : item,
                      ),
                    )
                  }
                  onBlur={() => void updateProduct(product, { name: product.name })}
                />
              ) : (
                <h3 className="text-2xl font-heading font-bold mb-1">{product.name}</h3>
              )}
              <p className="text-sm text-gray-500 mb-2">SKU: {product.sku || 'N/A'}</p>
              {product.unitsPerPackage !== null && product.unitsPerPackage !== undefined && (
                <p className="text-xs text-gray-400 mb-2">Units per package: {product.unitsPerPackage}</p>
              )}

              {isAuthenticated ? (
                <textarea
                  className="w-full bg-black border border-gray-700 px-3 py-2 text-sm text-gray-200 mb-3"
                  value={product.description}
                  rows={3}
                  onChange={(event) =>
                    setProducts((previous) =>
                      previous.map((item) =>
                        item.id === product.id ? { ...item, description: event.target.value } : item,
                      ),
                    )
                  }
                  onBlur={() => void updateProduct(product, { description: product.description })}
                />
              ) : (
                <p className="text-gray-300 text-sm mb-3">{product.description || 'No description yet.'}</p>
              )}

              <Link to={`/brands/piaa/catalog/product/${product.id}`} className="text-xs text-motorsport-yellow hover:underline">
                Open product page
              </Link>
            </div>

            <div className="md:text-right">
              {isAuthenticated ? (
                <input
                  className="w-full md:w-40 bg-black border border-gray-700 px-3 py-2 text-motorsport-yellow font-semibold"
                  value={product.price ?? ''}
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  onChange={(event) => {
                    const raw = event.target.value;
                    setProducts((previous) =>
                      previous.map((item) =>
                        item.id === product.id
                          ? { ...item, price: raw === '' ? null : Number(raw) }
                          : item,
                      ),
                    );
                  }}
                  onBlur={() => void updateProduct(product, { price: product.price })}
                />
              ) : (
                <p className="text-motorsport-yellow font-semibold">{formatPrice(product.price)}</p>
              )}

              {!isAuthenticated && (
                <div className="mt-3 border border-gray-700 bg-gray-950 p-3 text-left">
                  <label className="flex items-center gap-2 text-sm text-gray-200">
                    <input
                      type="checkbox"
                      checked={getProductQuantity(product.id) > 0}
                      onChange={(event) => setProductQuantity(product, event.target.checked ? 1 : 0)}
                    />
                    Add to cart
                  </label>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400">Quantity</span>
                    <div className="inline-flex items-center border border-gray-600">
                      <button
                        type="button"
                        className="px-2 py-1 text-gray-200 hover:bg-gray-800"
                        onClick={() =>
                          setProductQuantity(product, Math.max(0, getProductQuantity(product.id) - 1))
                        }
                        aria-label={`Decrease quantity for ${product.name}`}
                      >
                        <ChevronDown size={14} />
                      </button>
                      <span className="min-w-8 text-center text-sm">{getProductQuantity(product.id)}</span>
                      <button
                        type="button"
                        className="px-2 py-1 text-gray-200 hover:bg-gray-800"
                        onClick={() => setProductQuantity(product, getProductQuantity(product.id) + 1)}
                        aria-label={`Increase quantity for ${product.name}`}
                      >
                        <ChevronUp size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {product.folderName && <p className="text-xs text-gray-500 mt-2">Folder: {product.folderName}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      <section className="section-padding bg-black">
        <div className="container-narrow px-4 md:px-6">
          <Link to="/brands/piaa" className="inline-flex items-center text-motorsport-yellow mb-6 hover:underline">
            <ArrowLeft size={20} className="mr-2" />
            Back to PIAA Hub
          </Link>

          <PIAASubNav />

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">PIAA Catalogue</h1>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto">
              Professional-grade lighting solutions for motorsport and off-road applications.
              PIAA represents the gold standard in performance lighting technology.
            </p>
            <div className="mt-6">
              <button onClick={() => navigate('/cart')} className="btn-primary inline-flex items-center gap-2">
                <ShoppingCart size={18} />
                Go to Cart ({cartItemCount})
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/4">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 sticky top-8">
                <h2 className="text-xl font-heading font-bold mb-4 text-motorsport-yellow">Categories</h2>
                <nav className="space-y-1">
                  {groupedProducts.map((group) => (
                    <button
                      key={group.category}
                      onClick={() => setActiveSection(group.category)}
                      className={`w-full text-left px-4 py-3 rounded transition-colors ${
                        activeSection === group.category
                          ? 'bg-motorsport-yellow/20 text-motorsport-yellow border-l-4 border-motorsport-yellow'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <span>{group.category}</span>
                      <span className="ml-2 text-xs text-gray-500">({group.products.length})</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            <div className="lg:w-3/4">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 md:p-8">
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight mb-8">{activeSection}</h2>

                <div className="space-y-4">
                  {folderNames.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button
                        onClick={() => setActiveFolder('all')}
                        className={`px-3 py-1 text-xs border ${
                          activeFolder === 'all'
                            ? 'border-motorsport-yellow text-motorsport-yellow bg-motorsport-yellow/10'
                            : 'border-gray-700 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        All folders
                      </button>
                      {folderNames.map((folder) => (
                        <button
                          key={folder}
                          onClick={() => setActiveFolder(folder)}
                          className={`px-3 py-1 text-xs border ${
                            activeFolder === folder
                              ? 'border-motorsport-yellow text-motorsport-yellow bg-motorsport-yellow/10'
                              : 'border-gray-700 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {folder}
                        </button>
                      ))}
                    </div>
                  )}

                  {loading && <p className="text-gray-400">Loading products...</p>}

                  {!loading && visibleProducts.length === 0 && (
                    <div className="bg-gray-800/50 border border-gray-700 p-6 rounded">
                      <p className="text-gray-400">No products published yet in {activeSection}.</p>
                    </div>
                  )}

                  {!loading &&
                    (activeSection === 'Wiper Blades'
                      ? visibleWiperGroups.map((group) => (
                          <div key={group.label} className="space-y-3 mb-5">
                            <h3 className="text-xl font-heading font-bold text-motorsport-yellow">{group.label}</h3>
                            {group.products.length === 0 ? (
                              <div className="bg-gray-800/50 border border-gray-700 p-4 rounded text-gray-400 text-sm">
                                No products in this subcategory.
                              </div>
                            ) : (
                              group.products.map((product) => renderProductCard(product))
                            )}
                          </div>
                        ))
                      : visibleProducts.map((product) => renderProductCard(product)))}
                </div>

                {!loading && visibleProducts.length > 0 && (
                  <div className="pt-2">
                    <button onClick={() => navigate('/cart')} className="btn-primary inline-flex items-center gap-2">
                      <ShoppingCart size={18} />
                      Go to Cart ({cartItemCount})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {(() => {
        if (!modalProductId) {
          return null;
        }

        const modalProduct = products.find((item) => item.id === modalProductId);
        if (!modalProduct) {
          return null;
        }

        const imageReferences = Array.from(new Set([modalProduct.imageReference, ...(modalProduct.galleryImageReferences ?? [])].filter(Boolean)));
        if (imageReferences.length === 0) {
          return null;
        }

        const safeIndex = Math.max(0, Math.min(modalImageIndex, imageReferences.length - 1));
        const activeReference = imageReferences[safeIndex] ?? '';
        const activeImage = imageAssetService.resolveImage(activeReference);
        const canNavigate = imageReferences.length > 1;

        const goPrevious = () => {
          setModalImageIndex((previous) => (previous - 1 + imageReferences.length) % imageReferences.length);
        };

        const goNext = () => {
          setModalImageIndex((previous) => (previous + 1) % imageReferences.length);
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
            <div className="relative border border-gray-700 bg-black p-4 md:p-5 max-w-full">
              <button
                type="button"
                onClick={closeProductModal}
                className="absolute -top-3 -right-3 rounded-full bg-gray-900 border border-gray-600 p-2 text-gray-200 hover:text-white"
                aria-label="Close product image modal"
              >
                <X size={16} />
              </button>

              <div className="flex items-center justify-between mb-3 gap-4">
                <p className="text-sm text-gray-300">{modalProduct.name}</p>
                <p className="text-xs text-gray-500">
                  {safeIndex + 1}/{imageReferences.length}
                </p>
              </div>

              {activeImage ? (
                <img
                  src={activeImage}
                  alt={modalProduct.name}
                  className="object-contain border border-gray-800 bg-black"
                  style={{ width: settings.productModalDisplaySizePx, height: settings.productModalDisplaySizePx, maxWidth: '88vw', maxHeight: '78vh' }}
                  onError={(event) => {
                    const img = event.currentTarget;
                    if (img.src.endsWith(fallbackImage)) return;
                    img.src = fallbackImage;
                  }}
                />
              ) : (
                <div
                  className="border border-gray-800 bg-gray-900 text-gray-500 flex items-center justify-center"
                  style={{ width: settings.productModalDisplaySizePx, height: settings.productModalDisplaySizePx, maxWidth: '88vw', maxHeight: '78vh' }}
                >
                  No image
                </div>
              )}

              {canNavigate && (
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button type="button" onClick={goPrevious} className="btn-secondary inline-flex items-center gap-2">
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <button type="button" onClick={goNext} className="btn-secondary inline-flex items-center gap-2">
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default PIAACatalogPage;
