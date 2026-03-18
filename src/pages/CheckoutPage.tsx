import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { cartService } from '@/services/cartService';

const currency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
});

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => cartService.getCart());
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');

  const totals = useMemo(() => cartService.getTotals(cart), [cart]);

  const updateCustomer = (field: 'fullName' | 'phone' | 'email' | 'shipToAddress', value: string) => {
    const next = cartService.updateCustomer({ [field]: value });
    setCart(next);
  };

  const onCheckout = () => {
    if (cart.items.length === 0) {
      setMessage('Your cart is empty. Please add products before checkout.');
      return;
    }

    const requiredFields = [
      { key: 'fullName', label: 'Full name' },
      { key: 'phone', label: 'Contact phone' },
      { key: 'email', label: 'Email address' },
      { key: 'shipToAddress', label: 'Ship-to address' },
    ] as const;

    const missing = requiredFields.filter((field) => !cart.customer[field.key].trim());
    if (missing.length > 0) {
      setMessage(`Please complete: ${missing.map((item) => item.label).join(', ')}.`);
      return;
    }

    const placed = cartService.placeOrder();
    if (!placed) {
      setMessage('Unable to place order.');
      return;
    }

    setOrderId(placed.id);
    setMessage('Checkout complete. Order has been captured for export to logistics JSON in the next phase.');
    setCart(cartService.getCart());
  };

  return (
    <section className="section-padding bg-black min-h-screen">
      <div className="container-narrow px-4 md:px-6">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link to="/cart" className="inline-flex items-center text-motorsport-yellow hover:underline">
            <ArrowLeft size={18} className="mr-2" />
            Back to cart
          </Link>
          <h1 className="text-3xl md:text-4xl font-heading font-bold">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="border border-gray-800 bg-gray-950 p-5 space-y-4">
            <h2 className="text-xl font-heading font-bold">Customer & Shipping Details</h2>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Full name</label>
              <input
                className="w-full bg-black border border-gray-700 px-3 py-2"
                value={cart.customer.fullName}
                onChange={(event) => updateCustomer('fullName', event.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Contact phone</label>
              <input
                className="w-full bg-black border border-gray-700 px-3 py-2"
                value={cart.customer.phone}
                onChange={(event) => updateCustomer('phone', event.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Email address</label>
              <input
                type="email"
                className="w-full bg-black border border-gray-700 px-3 py-2"
                value={cart.customer.email}
                onChange={(event) => updateCustomer('email', event.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Ship-to address</label>
              <textarea
                className="w-full bg-black border border-gray-700 px-3 py-2"
                rows={4}
                value={cart.customer.shipToAddress}
                onChange={(event) => updateCustomer('shipToAddress', event.target.value)}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={cart.includeGst}
                onChange={(event) => {
                  const next = cartService.setIncludeGst(event.target.checked);
                  setCart(next);
                }}
              />
              Include GST (10% for Australian purchases)
            </label>
          </div>

          <div className="border border-gray-800 bg-gray-950 p-4 h-fit">
            <h2 className="text-xl font-heading font-bold mb-4">Totals</h2>

            <div className="space-y-2 text-sm mb-5">
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

            <button className="btn-primary w-full" onClick={onCheckout}>
              Complete Purchase
            </button>

            <button className="btn-secondary w-full mt-3" onClick={() => navigate('/cart')}>
              Return to Cart
            </button>

            {message && (
              <p className="text-sm text-gray-300 mt-4 inline-flex items-start gap-2">
                {orderId ? <CheckCircle2 size={16} className="text-green-400 mt-0.5" /> : null}
                <span>{message}</span>
              </p>
            )}

            {orderId && <p className="text-xs text-gray-500 mt-2">Order reference: {orderId}</p>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CheckoutPage;
