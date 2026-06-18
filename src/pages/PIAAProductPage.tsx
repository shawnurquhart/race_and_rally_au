import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ShoppingCart, Trash2, X } from 'lucide-react';
import { productService } from '@/services/productService';
import { imageAssetService } from '@/services/imageAssetService';
import { adminSettingsService } from '@/services/adminSettingsService';
import { useAdminAuth } from '@/auth/AdminAuthContext';
import { PIAA_CATEGORIES, type PiaaCategory, type Product } from '@/types/product';
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
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const fallbackImage = imageAssetService.getFallbackImagePath();

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

  const galleryItems = useMemo(() => {
    const seenResolved = new Set<string>();
    const items: Array<{ reference: string; resolved: string }> = [];

    galleryReferences.forEach((reference) => {
      const resolved = imageAssetService.resolveImage(reference);
      if (!resolved) {
        return;
      }

      // Prevent duplicate nav entries when multiple references resolve to same image URL/data.
      if (seenResolved.has(resolved)) {
        return;
      }

      seenResolved.add(resolved);
      items.push({ reference, resolved });
    });

    return items;
  }, [galleryReferences]);

  const activeReference = selectedImageReference || galleryReferences[0] || '';
  const activeImage = imageAssetService.resolveImage(activeReference);

  const activeGalleryIndex = useMemo(() => {
    if (!activeImage) {
      return 0;
    }
    return Math.max(0, galleryItems.findIndex((item) => item.resolved === activeImage));
  }, [activeImage, galleryItems]);

  const onSave = async () => {
    if (!product) {
      return;
    }

    const hasUsablePrimary = Boolean(product.imageReference && imageAssetService.resolveImage(product.imageReference));
    const fallbackPrimary = (product.galleryImageReferences ?? [])[0] ?? product.imageReference;

    await productService.upsert({
      ...product,
      imageReference: hasUsablePrimary ? product.imageReference : fallbackPrimary,
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

  const openImageModal = () => {
    if (!activeImage) {
      return;
    }

    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  const showPreviousModalImage = () => {
    if (galleryItems.length <= 1) {
      return;
    }

    const nextIndex = (activeGalleryIndex - 1 + galleryItems.length) % galleryItems.length;
    setSelectedImageReference(galleryItems[nextIndex]?.reference ?? '');
  };

  const showNextModalImage = () => {
    if (galleryItems.length <= 1) {
      return;
    }

    const nextIndex = (activeGalleryIndex + 1) % galleryItems.length;
    setSelectedImageReference(galleryItems[nextIndex]?.reference ?? '');
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
    const hasUsablePrimary = Boolean(product.imageReference && imageAssetService.resolveImage(product.imageReference));
    const nextPrimaryReference = hasUsablePrimary ? product.imageReference : storedReferences[0] ?? product.imageReference;

    await productService.upsert({
      ...product,
      imageReference: nextPrimaryReference,
      galleryImageReferences: nextGallery,
      updatedAt: new Date().toISOString(),
    });

    setMessage(`${storedReferences.length} additional image(s) uploaded.`);
    await loadProduct();
  };

  const onRemoveAdditionalImage = async (reference: string) => {
    if (!product) {
      return;
    }

    const nextGallery = (product.galleryImageReferences ?? []).filter((item) => item !== reference);
    const isRemovingPrimary = reference === product.imageReference;
    const nextPrimaryReference = isRemovingPrimary ? nextGallery[0] ?? '' : product.imageReference;

    imageAssetService.removeReference(reference);

    await productService.upsert({
      ...product,
      imageReference: nextPrimaryReference,
      galleryImageReferences: nextGallery,
      updatedAt: new Date().toISOString(),
    });

    if (selectedImageReference === reference) {
      setSelectedImageReference('');
    }

    setMessage('Image removed.');
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
              <div>
                <button type="button" onClick={openImageModal} className="inline-block">
                  <div
                    className="border border-gray-800 bg-black flex items-center justify-center overflow-hidden"
                    style={{ width: settings.productDetailDisplaySizePx, height: settings.productDetailDisplaySizePx, maxWidth: '100%' }}
                  >
                    <img
                      src={activeImage}
                      alt={product.name}
                      className="w-full h-full object-contain object-center"
                      onError={(event) => {
                        const img = event.currentTarget;
                        if (img.src.endsWith(fallbackImage)) return;
                        img.src = fallbackImage;
                      }}
                    />
                  </div>
                </button>
                <p className="text-xs text-motorsport-yellow mt-2">Click to enlarge</p>
              </div>
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

                const isPrimary = reference === product.imageReference;

                return (
                  <div key={reference} className="relative">
                    <button
                      onClick={() => setSelectedImageReference(reference)}
                      className={`border ${activeReference === reference ? 'border-motorsport-yellow' : 'border-gray-700'}`}
                    >
                      <div className="w-16 h-16 bg-black flex items-center justify-center overflow-hidden">
                        <img
                          src={thumb}
                          alt={product.name}
                          className="w-full h-full object-contain object-center"
                          onError={(event) => {
                            const img = event.currentTarget;
                            if (img.src.endsWith(fallbackImage)) return;
                            img.src = fallbackImage;
                          }}
                        />
                      </div>
                    </button>

                    {isAuthenticated && (
                      <button
                        type="button"
                        onClick={() => void onRemoveAdditionalImage(reference)}
                        className="absolute -top-2 -right-2 rounded-full bg-red-600 hover:bg-red-500 text-white p-1 border border-black"
                        aria-label={isPrimary ? 'Remove primary image' : 'Remove image'}
                        title={isPrimary ? 'Remove primary image' : 'Remove image'}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
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
                    {PIAA_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
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

      {isImageModalOpen && activeImage && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="relative border border-gray-700 bg-black p-4 md:p-5 max-w-full">
            <button
              type="button"
              onClick={closeImageModal}
              className="absolute -top-3 -right-3 rounded-full bg-gray-900 border border-gray-600 p-2 text-gray-200 hover:text-white"
              aria-label="Close product image modal"
            >
              <X size={16} />
            </button>

            <div className="flex items-center justify-between mb-3 gap-4">
              <p className="text-sm text-gray-300">{product.name}</p>
              <p className="text-xs text-gray-500">
                {activeGalleryIndex + 1}/{galleryItems.length || 1}
              </p>
            </div>

            <div
              className="border border-gray-800 bg-black flex items-center justify-center overflow-hidden"
              style={{ width: settings.productModalDisplaySizePx, height: settings.productModalDisplaySizePx, maxWidth: '88vw', maxHeight: '78vh' }}
            >
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-contain object-center"
                onError={(event) => {
                  const img = event.currentTarget;
                  if (img.src.endsWith(fallbackImage)) return;
                  img.src = fallbackImage;
                }}
              />
            </div>

            {galleryItems.length > 1 && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <button type="button" onClick={showPreviousModalImage} className="btn-secondary inline-flex items-center gap-2">
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button type="button" onClick={showNextModalImage} className="btn-secondary inline-flex items-center gap-2">
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default PIAAProductPage;
