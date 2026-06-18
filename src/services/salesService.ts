import { cartService, type CheckoutOrder } from '@/services/cartService';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/assets/backend/api';

export interface FulfilmentUpdateRow {
  orderId: string;
  sku: string;
  status: 'pending' | 'sent' | 'back-order' | 'manual-update' | 'cancelled';
  note?: string;
}

export const salesService = {
  async recordOrder(order: CheckoutOrder): Promise<void> {
    const res = await fetch(`${API_BASE}/sales.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'record', order }),
    });

    if (!res.ok) {
      throw new Error(`Sales record failed: ${res.status}`);
    }
  },

  async listOrders(): Promise<CheckoutOrder[]> {
    const res = await fetch(`${API_BASE}/sales.php`);
    if (!res.ok) {
      throw new Error(`Sales list failed: ${res.status}`);
    }

    const data = (await res.json()) as { orders?: CheckoutOrder[] };
    return Array.isArray(data.orders) ? data.orders : [];
  },

  async listOrdersWithFallback(): Promise<CheckoutOrder[]> {
    try {
      return await this.listOrders();
    } catch {
      return cartService.listOrders();
    }
  },

  async updateItemStatus(itemId: number, status: FulfilmentUpdateRow['status'], note?: string): Promise<void> {
    const res = await fetch(`${API_BASE}/sales.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateItemStatus', itemId, status, note: note ?? '' }),
    });
    if (!res.ok) {
      throw new Error(`Update item status failed: ${res.status}`);
    }
  },

  async bulkImportStatuses(updates: FulfilmentUpdateRow[]): Promise<void> {
    const res = await fetch(`${API_BASE}/sales.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulkImportStatuses', updates }),
    });
    if (!res.ok) {
      throw new Error(`Bulk import statuses failed: ${res.status}`);
    }
  },
};
