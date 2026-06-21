import type { CartCustomerInfo, CartItem, CartTotals } from '@/services/cartService';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/assets/backend/api';

export interface PaymentCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

export interface PaymentRequest {
  orderId?: string;
  merchantReference?: string;
  amount: number;
  currency: 'AUD';
  description: string;
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
  merchantId: string;
  apiKeyMasked: string;
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
};
