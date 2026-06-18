import type { Product } from '@/types/product';

const CART_STORAGE_KEY = 'rra_cart_v1';
const ORDER_STORAGE_KEY = 'rra_orders_v1';
export const CART_UPDATED_EVENT = 'rra-cart-updated';

export interface CartCustomerInfo {
  fullName: string;
  phone: string;
  email: string;
  shipToAddress: string;
}

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  imageReference: string;
  unitPrice: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  includeGst: boolean;
  customer: CartCustomerInfo;
}

export interface CartTotals {
  subtotal: number;
  gst: number;
  total: number;
}

export interface CheckoutOrder {
  id: string;
  createdAt: string;
  simulatedTransactionId: string;
  paymentMethod: 'simulated-card' | 'till-hosted-payment';
  paymentStatus: 'captured' | 'pending' | 'failed' | 'cancelled';
  paymentProvider?: string;
  paymentReference?: string;
  gatewayTransactionId?: string;
  paymentDate?: string;
  paymentResponse?: unknown;
  fulfilmentStatus: 'pending' | 'fulfilled';
  includeGst: boolean;
  customer: CartCustomerInfo;
  items: CartItem[];
  totals: CartTotals;
}

const makeOrderId = (): string => {
  const now = new Date();
  return `RRA-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
};

const makeSimulatedTransactionId = (): string => {
  const timestamp = Date.now();
  const token = Math.floor(10000 + Math.random() * 90000);
  return `SIM-TXN-${timestamp}-${token}`;
};

const emptyCustomer = (): CartCustomerInfo => ({
  fullName: '',
  phone: '',
  email: '',
  shipToAddress: '',
});

const defaultCartState = (): CartState => ({
  items: [],
  includeGst: true,
  customer: emptyCustomer(),
});

const readCart = (): CartState => {
  const raw = localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) {
    return defaultCartState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CartState>;
    return {
      items: Array.isArray(parsed.items) ? parsed.items.filter((item) => item.quantity > 0) : [],
      includeGst: typeof parsed.includeGst === 'boolean' ? parsed.includeGst : true,
      customer: {
        ...emptyCustomer(),
        ...(parsed.customer ?? {}),
      },
    };
  } catch {
    return defaultCartState();
  }
};

const writeCart = (state: CartState): void => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
};

const readOrders = (): CheckoutOrder[] => {
  const raw = localStorage.getItem(ORDER_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Array<Partial<CheckoutOrder>>;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((order): order is Partial<CheckoutOrder> & { id: string; createdAt: string } => Boolean(order?.id && order?.createdAt))
      .map((order) => ({
        id: order.id,
        createdAt: order.createdAt,
        simulatedTransactionId: order.simulatedTransactionId ?? `SIM-TXN-LEGACY-${order.id}`,
        paymentMethod: order.paymentMethod === 'till-hosted-payment' ? 'till-hosted-payment' : 'simulated-card',
        paymentStatus:
          order.paymentStatus === 'pending' || order.paymentStatus === 'failed' || order.paymentStatus === 'cancelled'
            ? order.paymentStatus
            : 'captured',
        paymentProvider: order.paymentProvider,
        paymentReference: order.paymentReference,
        gatewayTransactionId: order.gatewayTransactionId,
        paymentDate: order.paymentDate,
        paymentResponse: order.paymentResponse,
        fulfilmentStatus: order.fulfilmentStatus === 'fulfilled' ? 'fulfilled' : 'pending',
        includeGst: typeof order.includeGst === 'boolean' ? order.includeGst : true,
        customer: {
          fullName: order.customer?.fullName ?? '',
          phone: order.customer?.phone ?? '',
          email: order.customer?.email ?? '',
          shipToAddress: order.customer?.shipToAddress ?? '',
        },
        items: Array.isArray(order.items) ? order.items : [],
        totals: {
          subtotal: Number(order.totals?.subtotal ?? 0),
          gst: Number(order.totals?.gst ?? 0),
          total: Number(order.totals?.total ?? 0),
        },
      }));
  } catch {
    return [];
  }
};

const writeOrders = (orders: CheckoutOrder[]): void => {
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
};

const upsertItem = (items: CartItem[], next: CartItem): CartItem[] => {
  const index = items.findIndex((item) => item.productId === next.productId);
  if (index < 0) {
    return [...items, next];
  }

  const updated = [...items];
  updated[index] = next;
  return updated;
};

export const cartService = {
  getCart(): CartState {
    return readCart();
  },

  getItemQuantity(productId: string): number {
    return readCart().items.find((item) => item.productId === productId)?.quantity ?? 0;
  },

  getItemCount(): number {
    return readCart().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  setIncludeGst(includeGst: boolean): CartState {
    const current = readCart();
    const next = { ...current, includeGst };
    writeCart(next);
    return next;
  },

  updateCustomer(customer: Partial<CartCustomerInfo>): CartState {
    const current = readCart();
    const next = {
      ...current,
      customer: {
        ...current.customer,
        ...customer,
      },
    };
    writeCart(next);
    return next;
  },

  setProductQuantity(product: Product, quantity: number): CartState {
    const current = readCart();
    const safeQuantity = Math.max(0, Math.floor(quantity));
    const unitPrice = product.price ?? 0;

    const withoutItem = current.items.filter((item) => item.productId !== product.id);
    if (safeQuantity === 0) {
      const next = { ...current, items: withoutItem };
      writeCart(next);
      return next;
    }

    const nextItem: CartItem = {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      imageReference: product.imageReference,
      unitPrice,
      quantity: safeQuantity,
    };

    const next = { ...current, items: upsertItem(withoutItem, nextItem) };
    writeCart(next);
    return next;
  },

  removeItem(productId: string): CartState {
    const current = readCart();
    const next = {
      ...current,
      items: current.items.filter((item) => item.productId !== productId),
    };
    writeCart(next);
    return next;
  },

  clearCart(): CartState {
    const next = defaultCartState();
    writeCart(next);
    return next;
  },

  getTotals(state?: CartState): CartTotals {
    const cart = state ?? readCart();
    const subtotal = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const gst = cart.includeGst ? subtotal * 0.1 : 0;
    const total = subtotal + gst;

    return { subtotal, gst, total };
  },

  placeOrder(): CheckoutOrder | null {
    const cart = readCart();
    if (cart.items.length === 0) {
      return null;
    }

    const order: CheckoutOrder = {
      id: makeOrderId(),
      createdAt: new Date().toISOString(),
      simulatedTransactionId: makeSimulatedTransactionId(),
      paymentMethod: 'simulated-card',
      paymentStatus: 'captured',
      fulfilmentStatus: 'pending',
      includeGst: cart.includeGst,
      customer: cart.customer,
      items: cart.items,
      totals: this.getTotals(cart),
    };

    const orders = readOrders();
    writeOrders([order, ...orders]);
    this.clearCart();
    return order;
  },

  listOrders(): CheckoutOrder[] {
    return readOrders();
  },
};
