import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, ShoppingCart, Trash2 } from 'lucide-react';
import { CART_UPDATED_EVENT, cartService, type CartState } from '@/services/cartService';
import { imageAssetService } from '@/services/imageAssetService';
import { productService } from '@/services/productService';
import type { Product } from '@/types/product';

const currency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
});

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartState>(() => cartService.getCart());
  const [productMap, setProductMap] = useState<Record<string, Product>>({});

  const syncCart = () => setCart(cartService.getCart());

  useEffect(() => {
    const loadProducts = async () => {
      const products = await productService.list({ brand: 'piaa' });
      setProductMap(
        products.reduce<Record<string, Product>>((next, product) => {
          next[product.id] = product;
          return next;
        }, {}),
      );
    };

    void loadProducts();
  }, []);

  useEffect(() => {
    syncCart();
    const onCartUpdated = () => syncCart();

    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
    };
  }, []);

  const totals = useMemo(() => cartService.getTotals(cart), [cart]);

  const setQuantity = (productId: string, quantity: number) => {
    const product = productMap[productId];
    if (!product) {
      return;
    }

    cartService.setProductQuantity(product, quantity);
    syncCart();
  };

  return (
    <section className="section-padding bg-black min-h-screen">
      <div className="container-narrow px-4 md:px-6">
        <div className="flex items-center justify-between gap-3 mb-8">
          <Link to="/brands/piaa" className="inline-flex items-center text-motorsport-yellow hover:underline">
            <ArrowLeft size={18} className="mr-2" />
            Continue shopping
          </Link>
          <h1 className="text-3xl md:text-4xl font-heading font-bold inline-flex items-center gap-2">
            <ShoppingCart size={28} className="text-motorsport-yellow" />
            Cart
          </h1>
        </div>

        {cart.items.length === 0 ? (
          <div className="border border-gray-800 bg-gray-950 p-6 text-center">
            <p className="text-gray-300 mb-4">Your cart is currently empty.</p>
            <Link to="/brands/piaa" className="btn-primary inline-flex items-center gap-2">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-4">
              {cart.items.map((item) => {
                const image = imageAssetService.resolveImage(item.imageReference);
                const lineTotal = item.unitPrice * item.quantity;

                return (
                  <div key={item.productId} className="border border-gray-800 bg-gray-950 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-[96px_1fr] gap-4 items-start">
                      <div>
                        {image ? (
                          <img src={image} alt={item.name} className="w-24 h-24 object-cover border border-gray-800" />
                        ) : (
                          <div className="w-24 h-24 bg-gray-900 border border-gray-800 flex items-center justify-center text-xs text-gray-500">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                          <p className="text-xl font-heading font-bold">{item.name}</p>
                          <p className="text-xs text-gray-500">SKU: {item.sku || 'N/A'}</p>
                          <p className="text-sm text-motorsport-yellow mt-2">{currency.format(item.unitPrice)} each</p>
                        </div>

                        <div className="md:text-right">
                          <div className="inline-flex items-center border border-gray-700">
                            <button
                              type="button"
                              className="px-2 py-1 text-gray-200 hover:bg-gray-800"
                              onClick={() => setQuantity(item.productId, Math.max(0, item.quantity - 1))}
                              aria-label={`Decrease quantity for ${item.name}`}
                            >
                              <ChevronDown size={14} />
                            </button>
                            <span className="min-w-10 text-center text-sm">{item.quantity}</span>
                            <button
                              type="button"
                              className="px-2 py-1 text-gray-200 hover:bg-gray-800"
                              onClick={() => setQuantity(item.productId, item.quantity + 1)}
                              aria-label={`Increase quantity for ${item.name}`}
                            >
                              <ChevronUp size={14} />
                            </button>
                          </div>
                          <p className="text-sm mt-2 font-semibold">Line total: {currency.format(lineTotal)}</p>
                          <button
                            className="mt-2 inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200"
                            onClick={() => setQuantity(item.productId, 0)}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border border-gray-800 bg-gray-950 p-4 h-fit">
              <h2 className="text-xl font-heading font-bold mb-4">Order Summary</h2>

              <label className="flex items-center gap-2 text-sm text-gray-200 mb-4">
                <input
                  type="checkbox"
                  checked={cart.includeGst}
                  onChange={(event) => {
                    cartService.setIncludeGst(event.target.checked);
                    syncCart();
                  }}
                />
                Include GST (10% for Australian purchases)
              </label>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span>{currency.format(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">GST</span>
                  <span>{currency.format(totals.gst)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold border-t border-gray-800 pt-2 mt-2">
                  <span>Total</span>
                  <span className="text-motorsport-yellow">{currency.format(totals.total)}</span>
                </div>
              </div>

              <button className="btn-primary w-full mt-5" onClick={() => navigate('/checkout')}>
                Go to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CartPage;
