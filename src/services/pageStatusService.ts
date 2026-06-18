import { pageStatusRegistry, type PageUpdateStatus } from '@/config/pageStatusRegistry';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/assets/backend/api';
export const PAGE_STATUS_UPDATED_EVENT = 'rra_page_status_updated';

export interface PageStatusRow {
  pageKey: string;
  label: string;
  routePath: string | null;
  kind: 'page' | 'form';
  updateStatus: PageUpdateStatus;
  isOnline: boolean;
  notes: string;
  updatedAt?: string;
}

type ApiRow = {
  page_key: string;
  page_label: string;
  route_path: string | null;
  item_kind: 'page' | 'form';
  update_status: PageUpdateStatus;
  is_online: number;
  notes: string | null;
  updated_at: string;
};

const mergeWithDefaults = (rows: PageStatusRow[]): PageStatusRow[] => {
  const byKey = new Map(rows.map((row) => [row.pageKey, row]));
  return pageStatusRegistry.map((entry) => byKey.get(entry.key) ?? {
    pageKey: entry.key,
    label: entry.label,
    routePath: entry.routePath,
    kind: entry.kind,
    updateStatus: entry.defaultUpdateStatus,
    isOnline: entry.defaultIsOnline,
    notes: entry.defaultNotes,
  });
};

export const pageStatusService = {
  async list(): Promise<PageStatusRow[]> {
    const res = await fetch(`${API_BASE}/page_status.php`, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`Load failed: ${res.status}`);
    const data = (await res.json()) as { rows?: ApiRow[] };
    const rows = (data.rows ?? []).map((row) => ({
      pageKey: row.page_key,
      label: row.page_label,
      routePath: row.route_path,
      kind: row.item_kind,
      updateStatus: row.update_status,
      isOnline: Number(row.is_online) === 1,
      notes: row.notes ?? '',
      updatedAt: row.updated_at,
    }));
    return mergeWithDefaults(rows);
  },

  async setStatus(payload: {
    pageKey: string;
    label: string;
    routePath: string | null;
    kind: 'page' | 'form';
    updateStatus: PageUpdateStatus;
    isOnline: boolean;
    notes: string;
  }): Promise<void> {
    const res = await fetch(`${API_BASE}/page_status.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'setStatus', ...payload }),
    });
    if (!res.ok) throw new Error(`Save failed: ${res.status}`);
    window.dispatchEvent(new CustomEvent(PAGE_STATUS_UPDATED_EVENT));
  },

  async setManyStatus(rows: Array<{
    pageKey: string;
    label: string;
    routePath: string | null;
    kind: 'page' | 'form';
    updateStatus: PageUpdateStatus;
    isOnline: boolean;
    notes: string;
  }>): Promise<void> {
    for (const row of rows) {
      // sequential is fine here and keeps backend action simple
      // eslint-disable-next-line no-await-in-loop
      await this.setStatus(row);
    }
  },
};

export const buildOnlineLookup = (rows: PageStatusRow[]): Map<string, boolean> => {
  const lookup = new Map<string, boolean>();
  rows.forEach((row) => {
    if (row.routePath) {
      lookup.set(row.routePath, row.isOnline);
    }
  });
  return lookup;
};
