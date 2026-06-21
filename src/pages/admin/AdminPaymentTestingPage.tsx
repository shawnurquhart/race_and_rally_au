import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { tillPayments, type PaymentDiagnostics, type PaymentResponse } from '@/services/tillPayments';
import { cartService } from '@/services/cartService';
import type { Product } from '@/types/product';

const widgetOneProduct: Product = {
  id: 'test-widget-1',
  brand: 'piaa',
  category: 'PIAA CUBE and ROUND',
  name: 'Widget 1',
  sku: 'TEST-WIDGET-1',
  description: 'Payment testing product only. Do not fulfil.',
  price: 1,
  imageReference: '',
  isActive: true,
  createdAt: '2026-06-10T00:00:00.000Z',
  updatedAt: '2026-06-10T00:00:00.000Z',
};

const pretty = (value: unknown): string => {
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
};

const AdminPaymentTestingPage: React.FC = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('1.00');
  const [name, setName] = useState('Shawn Urquhart');
  const [email, setEmail] = useState('urquhartdigital@gmail.com');
  const [phone, setPhone] = useState('0417356491');
  const [address, setAddress] = useState('1 Test St Melbourne Vic 3000');
  const [diagnostics, setDiagnostics] = useState<PaymentDiagnostics | null>(null);
  const [response, setResponse] = useState<PaymentResponse | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const requestPreview = useMemo(() => {
    const [firstName, ...rest] = name.trim().split(/\s+/).filter(Boolean);
    return {
      merchantReference: `RRA-ADMIN-TEST-${Date.now()}`,
      amount: Number(amount),
      currency: 'AUD',
      description: 'Race & Rally Australia admin Till payment test',
      customer: {
        firstName: firstName ?? '',
        lastName: rest.join(' '),
        email,
        phone,
        address,
      },
      testMode: true,
    } as const;
  }, [address, amount, email, name, phone]);

  const loadDiagnostics = async () => {
    const data = await tillPayments.diagnostics();
    setDiagnostics(data);
  };

  useEffect(() => {
    void loadDiagnostics().catch(() => setMessage('Unable to load payment diagnostics.'));
  }, []);

  const createTestPayment = async () => {
    setBusy(true);
    setMessage('Creating Till payment session...');
    const result = await tillPayments.createPayment(requestPreview);
    setResponse(result);
    setMessage(result.ok ? 'Till returned a successful response.' : `Till request failed or needs request-format adjustment (${result.statusCode ?? 'unknown'}).`);
    setBusy(false);
    void loadDiagnostics().catch(() => undefined);
  };

  const addWidgetToCheckout = () => {
    cartService.setProductQuantity(widgetOneProduct, 1);
    cartService.updateCustomer({
      fullName: name,
      email,
      phone,
      shipToAddress: address,
    });
    navigate('/checkout');
  };

  return (
    <AdminLayout title="Payment Testing">
      <div className="space-y-6">
        <div className="border border-yellow-700 bg-yellow-400/10 p-4 text-sm text-yellow-100">
          Hosted payment testing only. Do not enter card details here. API credentials remain server-side in PHP config.
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-gray-800 bg-gray-950 p-5 space-y-4">
            <h2 className="text-xl font-heading font-bold">Create Test Payment</h2>
            <div className="border border-gray-800 bg-black p-3 text-sm">
              <p className="font-semibold text-motorsport-yellow">Test Product</p>
              <p>Widget 1 — AUD $1.00</p>
              <p className="text-xs text-gray-500 mt-1">Only available in this Payment Testing area. Not shown in the public catalogue.</p>
              <button className="btn-secondary mt-3 text-xs" onClick={addWidgetToCheckout}>
                Add Widget 1 to Checkout
              </button>
            </div>
            <label className="block text-sm">
              Amount AUD
              <input className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <label className="block text-sm">
              Customer name
              <input className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block text-sm">
              Email
              <input className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block text-sm">
              Phone
              <input className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="block text-sm">
              Address
              <textarea className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={address} onChange={(e) => setAddress(e.target.value)} />
            </label>
            <button className="btn-primary" onClick={createTestPayment} disabled={busy}>
              {busy ? 'Creating...' : diagnostics?.config.environment === 'sandbox' ? 'Sandbox Test Payment' : 'Create Test Payment'}
            </button>
            {message && <p className="text-sm text-gray-300">{message}</p>}
          </div>

          <div className="border border-gray-800 bg-gray-950 p-5 space-y-4">
            <h2 className="text-xl font-heading font-bold">Configuration</h2>
            <pre className="bg-black border border-gray-800 p-3 text-xs overflow-auto max-h-72">{pretty(diagnostics?.config ?? {})}</pre>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-gray-800 bg-gray-950 p-5">
            <h2 className="text-xl font-heading font-bold mb-3">Raw Request Preview</h2>
            <pre className="bg-black border border-gray-800 p-3 text-xs overflow-auto max-h-96">{pretty(requestPreview)}</pre>
          </div>
          <div className="border border-gray-800 bg-gray-950 p-5">
            <h2 className="text-xl font-heading font-bold mb-3">Raw Response</h2>
            <pre className="bg-black border border-gray-800 p-3 text-xs overflow-auto max-h-96">{pretty(response ?? {})}</pre>
            {response?.redirectUrl && (
              <a href={response.redirectUrl} className="btn-primary inline-block mt-3" target="_blank" rel="noreferrer">
                Open Redirect URL
              </a>
            )}
          </div>
        </div>

        <div className="border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-xl font-heading font-bold mb-3">Recent Payment Logs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[900px]">
              <thead className="bg-gray-900 text-gray-300">
                <tr>
                  <th className="text-left p-2">Created</th>
                  <th className="text-left p-2">Action</th>
                  <th className="text-left p-2">Reference</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Redirect URL</th>
                  <th className="text-left p-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {(diagnostics?.logs ?? []).map((log) => (
                  <tr key={log.id} className="border-t border-gray-800">
                    <td className="p-2">{log.created_at}</td>
                    <td className="p-2">{log.action_name}</td>
                    <td className="p-2">{log.merchant_reference}</td>
                    <td className="p-2">{log.status_code}</td>
                    <td className="p-2 break-all">{log.redirect_url}</td>
                    <td className="p-2">{log.error_message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentTestingPage;
