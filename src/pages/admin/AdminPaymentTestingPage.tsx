import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { tillPayments, type PaymentDiagnostics, type PaymentRequest, type PaymentResponse, type TillPublicConfig } from '@/services/tillPayments';
import { cartService } from '@/services/cartService';
import type { Product } from '@/types/product';

const SANDBOX_PAYLOAD_STORAGE_KEY = 'rra_sandbox_payment_payload_v1';

const emptyPaymentConfig = (): TillPublicConfig => ({
  environment: 'production',
  configured: false,
  apiBaseUrl: '',
  debitPathTemplate: '/api/v3/transaction/{apiKey}/debit',
  merchantId: '',
  apiKey: '',
  apiKeyMasked: '',
  apiKeySet: false,
  apiUsername: '',
  apiPassword: '',
  apiPasswordMasked: '',
  apiPasswordSet: false,
  sharedSecret: '',
  sharedSecretMasked: '',
  sharedSecretSet: false,
  publicIntegrationKey: '',
  authMode: 'basic',
  hmacEnabled: false,
  notificationUrl: '',
  successUrl: '',
  cancelUrl: '',
  errorUrl: '',
});

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

const buildSandboxPayload = (input: {
  amount: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  diagnostics: PaymentDiagnostics | null;
}): PaymentRequest => {
  const [firstName, ...rest] = input.name.trim().split(/\s+/).filter(Boolean);
  return {
    merchantReference: `RRA-ADMIN-TEST-${Date.now()}`,
    amount: Number(input.amount),
    currency: 'AUD',
    description: 'Race & Rally Australia admin Till payment test',
    successUrl: input.diagnostics?.config.successUrl || 'https://raceandrallyaustralia.com.au/checkout?payment=success',
    cancelUrl: input.diagnostics?.config.cancelUrl || 'https://raceandrallyaustralia.com.au/checkout?payment=cancelled',
    errorUrl: input.diagnostics?.config.errorUrl || 'https://raceandrallyaustralia.com.au/checkout?payment=error',
    callbackUrl: 'https://raceandrallyaustralia.com.au/api/till/postback',
    customer: {
      firstName: firstName ?? '',
      lastName: rest.join(' '),
      email: input.email,
      phone: input.phone,
      address: input.address,
      billingPhone: input.phone,
      billingAddress1: '1 Test St',
      billingCity: 'Melbourne',
      billingState: 'VIC',
      billingPostcode: '3000',
      billingCountry: 'AU',
    },
    merchantMetaData: 'source=race-and-rally-australia|testMode=true',
    testMode: true,
  };
};

const AdminPaymentTestingPage: React.FC = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('1.00');
  const [name, setName] = useState('John Citizen');
  const [email, setEmail] = useState('urquhartdigital@gmail.com');
  const [phone, setPhone] = useState('0400112233');
  const [address, setAddress] = useState('1 Test St Melbourne Vic 3000');
  const [diagnostics, setDiagnostics] = useState<PaymentDiagnostics | null>(null);
  const [response, setResponse] = useState<PaymentResponse | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMessage, setConfigMessage] = useState('');
  const [editableConfig, setEditableConfig] = useState<TillPublicConfig>(() => emptyPaymentConfig());
  const [sandboxPayloadText, setSandboxPayloadText] = useState('');
  const [gatewayResponseText, setGatewayResponseText] = useState('');

  const defaultSandboxPayload = useMemo(
    () => buildSandboxPayload({ amount, name, email, phone, address, diagnostics }),
    [address, amount, diagnostics, email, name, phone],
  );

  const requestPreview = useMemo(() => {
    try {
      return JSON.parse(sandboxPayloadText) as PaymentRequest;
    } catch {
      return defaultSandboxPayload;
    }
  }, [defaultSandboxPayload, sandboxPayloadText]);

  const loadDiagnostics = async () => {
    const data = await tillPayments.diagnostics();
    setDiagnostics(data);
    setEditableConfig({ ...emptyPaymentConfig(), ...data.config, apiKey: '', apiPassword: '', sharedSecret: '' });
  };

  useEffect(() => {
    void loadDiagnostics().catch(() => setMessage('Unable to load payment diagnostics.'));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(SANDBOX_PAYLOAD_STORAGE_KEY);
    if (saved) {
      setSandboxPayloadText(saved);
    }
  }, []);

  useEffect(() => {
    if (!sandboxPayloadText) {
      setSandboxPayloadText(pretty(defaultSandboxPayload));
    }
  }, [defaultSandboxPayload, sandboxPayloadText]);

  const resetSandboxPayload = () => {
    const next = pretty(defaultSandboxPayload);
    setSandboxPayloadText(next);
    localStorage.setItem(SANDBOX_PAYLOAD_STORAGE_KEY, next);
    setMessage('Sandbox payload reset to current sandbox defaults.');
  };

  const createTestPayment = async () => {
    let editablePayload: PaymentRequest;
    try {
      editablePayload = JSON.parse(sandboxPayloadText) as PaymentRequest;
    } catch {
      setMessage('Sandbox payload JSON is invalid. Please fix it or use Reset to sandbox defaults.');
      return;
    }

    localStorage.setItem(SANDBOX_PAYLOAD_STORAGE_KEY, sandboxPayloadText);
    setBusy(true);
    setMessage('Creating Till payment session...');
    const result = await tillPayments.createPayment(editablePayload);
    setResponse(result);
    setGatewayResponseText(pretty(result));
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

  const updateConfig = <K extends keyof TillPublicConfig>(key: K, value: TillPublicConfig[K]) => {
    setEditableConfig((previous) => ({ ...previous, [key]: value }));
  };

  const savePaymentConfig = async () => {
    setConfigSaving(true);
    setConfigMessage('Saving payment gateway configuration...');
    try {
      const saved = await tillPayments.saveConfig(editableConfig.environment, editableConfig);
      setEditableConfig({ ...emptyPaymentConfig(), ...saved, apiKey: '', apiPassword: '', sharedSecret: '' });
      setDiagnostics((previous) => (previous ? { ...previous, config: saved } : previous));
      setConfigMessage('Payment gateway configuration saved. Secret fields remain blank after save for safety.');
      await loadDiagnostics();
    } catch (error) {
      setConfigMessage(error instanceof Error ? error.message : 'Unable to save payment gateway configuration.');
    } finally {
      setConfigSaving(false);
    }
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <label className="block">
                Environment
                <input className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={editableConfig.environment} readOnly />
              </label>
              <label className="block">
                Auth mode
                <select className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={editableConfig.authMode} onChange={(event) => updateConfig('authMode', event.target.value)}>
                  <option value="basic">basic</option>
                  <option value="none">none</option>
                  <option value="public_hmac">public_hmac - Public Integration Key + Shared Secret HMAC</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                API base URL
                <input className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={editableConfig.apiBaseUrl} onChange={(event) => updateConfig('apiBaseUrl', event.target.value)} />
              </label>
              <label className="block md:col-span-2">
                Debit path template
                <input className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={editableConfig.debitPathTemplate} onChange={(event) => updateConfig('debitPathTemplate', event.target.value)} />
              </label>
              <label className="block">
                Merchant ID
                <input className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={editableConfig.merchantId} onChange={(event) => updateConfig('merchantId', event.target.value)} />
              </label>
              <label className="block">
                Public integration key
                <input className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={editableConfig.publicIntegrationKey} onChange={(event) => updateConfig('publicIntegrationKey', event.target.value)} />
              </label>
              <label className="block">
                API key {editableConfig.apiKeyMasked ? `(current: ${editableConfig.apiKeyMasked})` : editableConfig.apiKeySet ? '(current: set)' : '(not set)'}
                <input className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={editableConfig.apiKey} onChange={(event) => updateConfig('apiKey', event.target.value)} placeholder="Leave blank to keep existing" />
              </label>
              <label className="block">
                API username
                <input className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={editableConfig.apiUsername} onChange={(event) => updateConfig('apiUsername', event.target.value)} />
              </label>
              <label className="block">
                API password {editableConfig.apiPasswordMasked ? `(current: ${editableConfig.apiPasswordMasked})` : editableConfig.apiPasswordSet ? '(current: set)' : '(not set)'}
                <input type="password" className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={editableConfig.apiPassword} onChange={(event) => updateConfig('apiPassword', event.target.value)} placeholder="Leave blank to keep existing" />
              </label>
              <label className="block">
                Shared secret {editableConfig.sharedSecretMasked ? `(current: ${editableConfig.sharedSecretMasked})` : editableConfig.sharedSecretSet ? '(current: set)' : '(not set)'}
                <input type="password" className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={editableConfig.sharedSecret} onChange={(event) => updateConfig('sharedSecret', event.target.value)} placeholder="Leave blank to keep existing" />
              </label>
              <label className="block md:col-span-2">
                Notification URL
                <input className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={editableConfig.notificationUrl} onChange={(event) => updateConfig('notificationUrl', event.target.value)} />
              </label>
              <label className="block md:col-span-2">
                Success URL
                <input className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={editableConfig.successUrl} onChange={(event) => updateConfig('successUrl', event.target.value)} />
              </label>
              <label className="block md:col-span-2">
                Cancel URL
                <input className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={editableConfig.cancelUrl} onChange={(event) => updateConfig('cancelUrl', event.target.value)} />
              </label>
              <label className="block md:col-span-2">
                Error URL
                <input className="mt-1 w-full bg-black border border-gray-700 px-3 py-2" value={editableConfig.errorUrl} onChange={(event) => updateConfig('errorUrl', event.target.value)} />
              </label>
              <label className="md:col-span-2 flex items-center gap-2">
                <input type="checkbox" checked={editableConfig.hmacEnabled} onChange={(event) => updateConfig('hmacEnabled', event.target.checked)} />
                Enable HMAC request signing
              </label>
            </div>
            <button className="btn-primary" onClick={() => void savePaymentConfig()} disabled={configSaving}>
              {configSaving ? 'Saving...' : 'Save Payment Configuration'}
            </button>
            <p className="text-xs text-gray-400">
              For `public_hmac`, the backend sends masked diagnostic headers in the test response: X-API-Key, X-Public-Integration-Key, X-Signature and X-Signature-Algorithm.
            </p>
            {configMessage ? <p className="text-sm text-gray-300">{configMessage}</p> : null}
            <details className="border border-gray-800 bg-black p-3 text-xs">
              <summary className="cursor-pointer text-gray-300">Raw masked diagnostics</summary>
              <pre className="mt-3 overflow-auto max-h-72">{pretty(diagnostics?.config ?? {})}</pre>
            </details>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-yellow-800 bg-yellow-950/20 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="text-xl font-heading font-bold">Current Sandbox Payload Config</h2>
                <p className="text-xs text-yellow-100/80 mt-1">Editable JSON used by the Sandbox Test Payment button. Changes are saved in this browser.</p>
              </div>
              <button className="btn-secondary text-xs" onClick={resetSandboxPayload}>
                Reset to sandbox defaults
              </button>
            </div>
            <textarea
              className="w-full min-h-[420px] bg-black border border-yellow-800/70 p-3 text-xs font-mono text-yellow-50"
              value={sandboxPayloadText}
              onChange={(event) => setSandboxPayloadText(event.target.value)}
              spellCheck={false}
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button className="btn-primary" onClick={createTestPayment} disabled={busy}>
                {busy ? 'Submitting Sandbox Payload...' : 'Submit Current Sandbox Payload'}
              </button>
              <p className="text-xs text-yellow-100/70">
                Submits the editable JSON above and saves it to this browser before sending.
              </p>
            </div>
          </div>

          <div className="border border-gray-800 bg-gray-950 p-5">
            <h2 className="text-xl font-heading font-bold mb-3">Sandbox Response Form</h2>
            <p className="text-xs text-gray-400 mb-3">Latest gateway response is copied here after a test. You can also paste a response from Till/Nuvei for review.</p>
            <textarea
              className="w-full min-h-[420px] bg-black border border-gray-800 p-3 text-xs font-mono text-gray-100"
              value={gatewayResponseText}
              onChange={(event) => setGatewayResponseText(event.target.value)}
              placeholder="Sandbox gateway response JSON or notes..."
              spellCheck={false}
            />
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
