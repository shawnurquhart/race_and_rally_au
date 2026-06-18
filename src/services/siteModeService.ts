export type SiteMode = 'standard' | 'hide_admin' | 'update_mode';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/assets/backend/api';
export const SITE_MODE_UPDATED_EVENT = 'rra_site_mode_updated';

const normalizeSiteMode = (value: unknown): SiteMode => {
  if (value === 'hide_admin' || value === 'update_mode' || value === 'standard') return value;
  return 'standard';
};

export const siteModeService = {
  async getMode(): Promise<SiteMode> {
    const res = await fetch(`${API_BASE}/site_mode.php`, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`Site mode fetch failed: ${res.status}`);
    const data = (await res.json()) as { siteMode?: unknown };
    return normalizeSiteMode(data.siteMode);
  },

  async setMode(mode: SiteMode): Promise<SiteMode> {
    const res = await fetch(`${API_BASE}/site_mode.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'setMode', mode }),
    });
    if (!res.ok) throw new Error(`Site mode save failed: ${res.status}`);
    const data = (await res.json()) as { siteMode?: unknown };
    const next = normalizeSiteMode(data.siteMode);
    window.dispatchEvent(new CustomEvent(SITE_MODE_UPDATED_EVENT, { detail: next }));
    return next;
  },
};
