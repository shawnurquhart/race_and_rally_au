import type { CartCustomerInfo, CartItem, CartTotals } from '@/services/cartService';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/assets/backend/api';

export interface PaymentCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  billingPhone?: string;
  billingAddress1?: string;
  billingCity?: string;
  billingState?: string;
  billingPostcode?: string;
  billingCountry?: string;
}

export interface PaymentRequest {
  orderId?: string;
  merchantTransactionId?: string;
  merchantReference?: string;
  amount: number | string;
  currency: 'AUD';
  description: string;
  successUrl?: string;
  cancelUrl?: string;
  errorUrl?: string;
  callbackUrl?: string;
  merchantMetaData?: string;
  customer: PaymentCustomer;
  items?: CartItem[];
  totals?: CartTotals;
  testMode?: boolean;
}

export interface PaymentResponse {
  ok: boolean;
  statusCode?: number;
  merchantReference?: string;
  redirectUrl?: string | null;
  requestPayload?: unknown;
  responsePayload?: unknown;
  error?: string | null;
}

export interface PaymentLogEntry {
  id: number;
  created_at: string;
  provider: string;
  action_name: string;
  order_id: string | null;
  merchant_reference: string | null;
  status_code: number | null;
  request_payload: string | null;
  response_payload: string | null;
  redirect_url: string | null;
  error_message: string | null;
}

export interface TillPublicConfig {
  environment: 'production' | 'sandbox';
  configured: boolean;
  apiBaseUrl: string;
  debitPathTemplate: string;
  attemptedEndpointMasked?: string;
  merchantId: string;
  apiKey: string;
  apiKeyMasked: string;
  apiKeySet: boolean;
  apiUsername: string;
  apiPassword: string;
  apiPasswordMasked: string;
  apiPasswordSet: boolean;
  sharedSecret: string;
  sharedSecretMasked: string;
  sharedSecretSet: boolean;
  publicIntegrationKey: string;
  authMode: string;
  hmacEnabled: boolean;
  notificationUrl: string;
  successUrl: string;
  cancelUrl: string;
  errorUrl: string;
}

export interface PaymentDiagnostics {
  config: TillPublicConfig;
  logs: PaymentLogEntry[];
}

const splitName = (fullName: string): { firstName: string; lastName: string } => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.at(-1) ?? '' };
};

export const tillPayments = {
  customerFromCart(customer: CartCustomerInfo): PaymentCustomer {
    const name = splitName(customer.fullName);
    return {
      ...name,
      email: customer.email,
      phone: customer.phone,
      address: customer.shipToAddress,
    };
  },

  async createPayment(payment: PaymentRequest): Promise<PaymentResponse> {
    const res = await fetch(`${API_BASE}/payments.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'createTillPayment', payment }),
    });
    const data = (await res.json().catch(() => ({}))) as PaymentResponse;
    if (!res.ok) {
      return { ...data, ok: false, statusCode: data.statusCode ?? res.status };
    }
    return data;
  },

  async diagnostics(): Promise<PaymentDiagnostics> {
    const res = await fetch(`${API_BASE}/payments.php`);
    if (!res.ok) {
      throw new Error(`Payment diagnostics failed: ${res.status}`);
    }
    const data = (await res.json()) as Partial<PaymentDiagnostics>;
    return {
      config: data.config as TillPublicConfig,
      logs: Array.isArray(data.logs) ? data.logs : [],
    };
  },

  async saveConfig(environment: 'production' | 'sandbox', config: TillPublicConfig): Promise<TillPublicConfig> {
    const res = await fetch(`${API_BASE}/payments.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        action: 'savePaymentConfig',
        environment,
        config: {
          api_base_url: config.apiBaseUrl,
          debit_path_template: config.debitPathTemplate,
          api_key: config.apiKey,
          api_username: config.apiUsername,
          api_password: config.apiPassword,
          shared_secret: config.sharedSecret,
          public_integration_key: config.publicIntegrationKey,
          merchant_id: config.merchantId,
          notification_url: config.notificationUrl,
          success_url: config.successUrl,
          cancel_url: config.cancelUrl,
          error_url: config.errorUrl,
          auth_mode: config.authMode,
          enable_hmac: config.hmacEnabled,
        },
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { config?: TillPublicConfig; error?: string };
    if (!res.ok || !data.config) {
      throw new Error(data.error || `Payment config save failed: ${res.status}`);
    }
    return data.config;
  },
};
