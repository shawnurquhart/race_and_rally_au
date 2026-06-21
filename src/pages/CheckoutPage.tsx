import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { cartService, type CheckoutOrder } from '@/services/cartService';
import jsPDF from 'jspdf';
import { salesService } from '@/services/salesService';
import { testCustomers } from '@/data/testCustomers';
import { tillPayments } from '@/services/tillPayments';

const currency = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
});

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => cartService.getCart());
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');
  const [receiptOrder, setReceiptOrder] = useState<CheckoutOrder | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentEnvironment, setPaymentEnvironment] = useState<'production' | 'sandbox'>('production');

  const totals = useMemo(() => cartService.getTotals(cart), [cart]);
  const isSandboxPayment = paymentEnvironment === 'sandbox';

  useEffect(() => {
    void tillPayments
      .diagnostics()
      .then((diagnostics) => setPaymentEnvironment(diagnostics.config.environment))
      .catch(() => setPaymentEnvironment('production'));
  }, []);

  const updateCustomer = (field: 'fullName' | 'phone' | 'email' | 'shipToAddress', value: string) => {
    const next = cartService.updateCustomer({ [field]: value });
    setCart(next);
  };

  const applyCustomer = (customer: (typeof testCustomers)[number]) => {
    const next = cartService.updateCustomer({
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      shipToAddress: customer.shipToAddress,
    });
    setCart(next);
    setShowCustomerModal(false);
  };

  const onCheckout = async () => {
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
    setReceiptOrder(placed);
    try {
      await salesService.recordOrder(placed);
      setMessage('Checkout complete. Order has been captured and saved to Sales records.');
    } catch {
      setMessage('Checkout complete. Order captured locally, but Sales API save is currently unavailable.');
    }
    setCart(cartService.getCart());
  };

  const validateCheckoutDetails = (): string | null => {
    if (cart.items.length === 0) return 'Your cart is empty. Please add products before checkout.';
    const requiredFields = [
      { key: 'fullName', label: 'Full name' },
      { key: 'phone', label: 'Contact phone' },
      { key: 'email', label: 'Email address' },
      { key: 'shipToAddress', label: 'Ship-to address' },
    ] as const;
    const missing = requiredFields.filter((field) => !cart.customer[field.key].trim());
    return missing.length > 0 ? `Please complete: ${missing.map((item) => item.label).join(', ')}.` : null;
  };

  const onProceedToPayment = async () => {
    const validationMessage = validateCheckoutDetails();
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setPaymentBusy(true);
    setMessage(
      isSandboxPayment
        ? 'Creating Till sandbox test payment session...'
        : 'Creating secure Till hosted payment session...',
    );
    const merchantReference = `RRA-${Date.now()}`;
    const response = await tillPayments.createPayment({
      merchantReference,
      amount: totals.total,
      currency: 'AUD',
      description: `Race & Rally Australia order ${merchantReference}`,
      customer: tillPayments.customerFromCart(cart.customer),
      items: cart.items,
      totals,
    });
    setPaymentBusy(false);

    if (response.redirectUrl) {
      window.location.href = response.redirectUrl;
      return;
    }

    setMessage(
      `Till payment session request returned status ${response.statusCode ?? 'unknown'} but no redirect URL. Check Admin > Payment Testing logs.`,
    );
  };

  const downloadReceipt = () => {
    if (!receiptOrder) return;

    const order = receiptOrder;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const margin = 40;
    let y = 50;

    doc.setFillColor(0, 0, 0);
    doc.circle(margin + 16, y, 16, 'F');
    doc.setTextColor(255, 204, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('RRA', margin + 8.5, y + 3);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Race and Rally Australia', margin + 40, y - 4);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Sales Receipt / Invoice', margin + 40, y + 16);

    y += 40;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 22;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${order.id}`, margin, y);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString('en-AU')}`, pageWidth / 2, y);
    y += 16;
    doc.text(`Transaction #: ${order.simulatedTransactionId}`, margin, y);
    doc.text(`Payment: ${order.paymentMethod} (${order.paymentStatus})`, pageWidth / 2, y);

    y += 28;
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    const customerLines = [
      order.customer.fullName,
      order.customer.phone,
      order.customer.email,
      ...order.customer.shipToAddress.split('\n'),
    ];
    customerLines.forEach((line) => {
      doc.text(line, margin, y);
      y += 13;
    });

    y += 12;
    const colX = {
      sku: margin + 8,
      item: margin + 90,
      qty: pageWidth - margin - 170,
      unit: pageWidth - margin - 110,
      line: pageWidth - margin - 12,
    };

    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, pageWidth - margin * 2, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('SKU', colX.sku, y + 13);
    doc.text('Item', colX.item, y + 13);
    doc.text('Qty', colX.qty, y + 13, { align: 'right' });
    doc.text('Unit', colX.unit, y + 13, { align: 'right' });
    doc.text('Line Total', colX.line, y + 13, { align: 'right' });
    y += 20;

    doc.setFont('helvetica', 'normal');
    order.items.forEach((item) => {
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y, pageWidth - margin, y);
      y += 14;
      doc.text(item.sku, colX.sku, y);
      doc.text(item.name.substring(0, 45), colX.item, y);
      doc.text(String(item.quantity), colX.qty, y, { align: 'right' });
      doc.text(currency.format(item.unitPrice), colX.unit, y, { align: 'right' });
      doc.text(currency.format(item.unitPrice * item.quantity), colX.line, y, { align: 'right' });
      y += 8;
    });

    y += 16;
    const totalsXLabel = pageWidth - margin - 170;
    const totalsXValue = pageWidth - margin - 12;
    doc.text('Subtotal', totalsXLabel, y);
    doc.text(currency.format(order.totals.subtotal), totalsXValue, y, { align: 'right' });
    y += 15;
    doc.text('GST', totalsXLabel, y);
    doc.text(currency.format(order.totals.gst), totalsXValue, y, { align: 'right' });
    y += 16;
    doc.setFont('helvetica', 'bold');
    doc.line(totalsXLabel, y - 10, totalsXValue, y - 10);
    doc.text('Total', totalsXLabel, y);
    doc.text(currency.format(order.totals.total), totalsXValue, y, { align: 'right' });

    y += 26;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('Financial transaction is currently simulated while external sales transaction API details are pending.', margin, y);

    doc.save(`receipt-${order.id}.pdf`);
  };

  const emailReceipt = () => {
    if (!receiptOrder) return;

    const subject = encodeURIComponent(`Receipt ${receiptOrder.id} - Race and Rally Australia`);
    const body = encodeURIComponent(
      [
        `Hi ${receiptOrder.customer.fullName},`,
        '',
        `Thank you for your purchase.`,
        `Order reference: ${receiptOrder.id}`,
        `Transaction reference: ${receiptOrder.simulatedTransactionId}`,
        `Total: ${currency.format(receiptOrder.totals.total)}`,
        '',
        'This transaction is currently simulated while payment API integration is pending.',
      ].join('\n'),
    );

    window.location.href = `mailto:${receiptOrder.customer.email}?subject=${subject}&body=${body}`;
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

            <button
              type="button"
              className="btn-secondary text-xs px-3 py-2"
              onClick={() => setShowCustomerModal(true)}
            >
              Display Customers
            </button>

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

            <button className="btn-primary w-full" onClick={onProceedToPayment} disabled={paymentBusy}>
              {paymentBusy ? 'Creating Payment...' : isSandboxPayment ? 'Sandbox Test Payment' : 'Proceed to Payment'}
            </button>

            {isSandboxPayment ? (
              <p className="mt-2 border border-yellow-700 bg-yellow-400/10 p-2 text-xs text-yellow-100">
                Sandbox mode is active. This button creates a Till/Nuvei test payment session only.
              </p>
            ) : null}

            <button className="btn-secondary w-full mt-3" onClick={onCheckout}>
              Simulate Purchase (Admin/Test)
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

      {receiptOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-auto bg-white text-black rounded shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-black text-motorsport-yellow font-bold flex items-center justify-center">
                  RRA
                </div>
                <div>
                  <p className="text-sm text-gray-500">Race and Rally Australia</p>
                  <h3 className="text-xl font-bold">Sales Receipt / Invoice</h3>
                </div>
              </div>
              <button
                className="border border-gray-300 px-3 py-1.5 text-sm"
                onClick={() => {
                  setReceiptOrder(null);
                  navigate('/brands/piaa', { replace: true });
                }}
              >
                Close
              </button>
            </div>

            <div className="p-6 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-500">Invoice #</p>
                  <p className="font-semibold">{receiptOrder.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-semibold">{new Date(receiptOrder.createdAt).toLocaleString('en-AU')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Transaction #</p>
                  <p className="font-semibold">{receiptOrder.simulatedTransactionId}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment</p>
                  <p className="font-semibold">{receiptOrder.paymentMethod} ({receiptOrder.paymentStatus})</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="font-semibold mb-1">Bill To</p>
                <p>{receiptOrder.customer.fullName}</p>
                <p>{receiptOrder.customer.phone}</p>
                <p>{receiptOrder.customer.email}</p>
                <p className="whitespace-pre-line">{receiptOrder.customer.shipToAddress}</p>
              </div>

              <div className="border border-gray-200 overflow-hidden mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-2">SKU</th>
                      <th className="text-left p-2">Item</th>
                      <th className="text-right p-2">Qty</th>
                      <th className="text-right p-2">Unit</th>
                      <th className="text-right p-2">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptOrder.items.map((item) => (
                      <tr key={item.productId} className="border-t border-gray-200">
                        <td className="p-2">{item.sku}</td>
                        <td className="p-2">{item.name}</td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2 text-right">{currency.format(item.unitPrice)}</td>
                        <td className="p-2 text-right">{currency.format(item.unitPrice * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ml-auto w-full max-w-sm space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{currency.format(receiptOrder.totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST</span>
                  <span>{currency.format(receiptOrder.totals.gst)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>Total</span>
                  <span>{currency.format(receiptOrder.totals.total)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-6">
                Financial transaction is currently simulated while external sales transaction API details are pending.
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 flex flex-wrap gap-3 justify-end">
              <button className="border border-gray-300 px-4 py-2" onClick={downloadReceipt}>
                Download
              </button>
              <button className="bg-black text-white px-4 py-2" onClick={emailReceipt}>
                Send to Email
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-auto bg-gray-950 border border-gray-700 shadow-2xl">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-heading font-bold">Select Customer</h3>
              <button className="border border-gray-600 px-3 py-1 text-sm" onClick={() => setShowCustomerModal(false)}>
                Close
              </button>
            </div>

            <div className="p-4">
              <div className="overflow-x-auto border border-gray-800">
                <table className="w-full text-sm min-w-[860px]">
                  <thead className="bg-gray-900 text-gray-300">
                    <tr>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Phone</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">State</th>
                      <th className="text-left p-2">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testCustomers.map((customer) => (
                      <tr
                        key={customer.email}
                        className="border-t border-gray-800 hover:bg-gray-900/70 cursor-pointer"
                        onClick={() => applyCustomer(customer)}
                        title="Click to use this customer"
                      >
                        <td className="p-2 text-white">{customer.fullName}</td>
                        <td className="p-2 text-gray-300">{customer.phone}</td>
                        <td className="p-2 text-gray-300">{customer.email}</td>
                        <td className="p-2 text-gray-300">{customer.state}</td>
                        <td className="p-2 text-gray-300 whitespace-pre-line">{customer.shipToAddress}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-2">Click any row to populate checkout details and close this window.</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CheckoutPage;
