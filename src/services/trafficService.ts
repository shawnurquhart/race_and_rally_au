const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/assets/backend/api';

export type TrafficLogRow = {
  id: number;
  visitedAt: string;
  createdAt?: string;
  pagePath: string;
  ipAddress: string;
  countryCode: string | null;
  countryName: string | null;
  geoLookupStatus?: string | null;
  geoLookupProvider?: string | null;
  sessionId: string;
  viewStartedAt: string | null;
  viewEndedAt: string | null;
  viewDurationSeconds: number | null;
  referrer: string | null;
  userAgent: string | null;
};

export type TrafficFilters = {
  page?: string;
  from?: string;
  to?: string;
  sessionId?: string;
};

const buildQuery = (filters: TrafficFilters = {}): string => {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', filters.page);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.sessionId) params.set('sessionId', filters.sessionId);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const trafficService = {
  getOrCreateSessionId(): string {
    const key = 'rra_traffic_session_id';
    const existing = localStorage.getItem(key);
    if (existing) return existing;

    const generated =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(key, generated);
    return generated;
  },

  async trackVisit(payload: {
    pagePath: string;
    sessionId: string;
    visitedAt?: string;
    viewStartedAt?: string;
    viewEndedAt?: string;
    viewDurationSeconds?: number;
    referrer?: string;
  }): Promise<void> {
    const res = await fetch(`${API_BASE}/traffic.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'track', ...payload }),
      credentials: 'same-origin',
    });
    if (!res.ok) {
      throw new Error(`Traffic track failed: ${res.status}`);
    }
  },

  sendBeaconTrack(payload: {
    pagePath: string;
    sessionId: string;
    visitedAt?: string;
    viewStartedAt?: string;
    viewEndedAt?: string;
    viewDurationSeconds?: number;
    referrer?: string;
  }): void {
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;
    const body = JSON.stringify({ action: 'track', ...payload });
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon(`${API_BASE}/traffic.php`, blob);
  },

  async listLogs(filters: TrafficFilters = {}): Promise<{ logs: TrafficLogRow[]; pages: string[] }> {
    const res = await fetch(`${API_BASE}/traffic.php${buildQuery(filters)}`, {
      credentials: 'same-origin',
    });
    if (!res.ok) {
      throw new Error(`Traffic list failed: ${res.status}`);
    }
    const data = (await res.json()) as { logs?: TrafficLogRow[]; pages?: string[] };
    return {
      logs: Array.isArray(data.logs) ? data.logs : [],
      pages: Array.isArray(data.pages) ? data.pages : [],
    };
  },

  async resetLogs(): Promise<void> {
    const res = await fetch(`${API_BASE}/traffic.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' }),
      credentials: 'same-origin',
    });
    if (!res.ok) {
      throw new Error(`Traffic reset failed: ${res.status}`);
    }
  },

  getCsvDownloadUrl(filters: TrafficFilters = {}): string {
    const qs = buildQuery(filters);
    if (!qs) return `${API_BASE}/traffic.php?format=csv`;
    return `${API_BASE}/traffic.php${qs}&format=csv`;
  },
};
