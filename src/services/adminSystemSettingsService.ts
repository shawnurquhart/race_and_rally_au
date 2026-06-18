const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/assets/backend/api';
export type SiteMode = 'standard' | 'hide_admin' | 'update_mode';

const normalizeSiteMode = (value: unknown): SiteMode => {
  if (value === 'hide_admin' || value === 'update_mode' || value === 'standard') return value;
  return 'standard';
};

export const adminSystemSettingsService = {
  async getContactFormToEmail(): Promise<string> {
    const res = await fetch(`${API_BASE}/settings.php`, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`Settings fetch failed: ${res.status}`);
    const data = (await res.json()) as { contactFormToEmail?: string };
    return (data.contactFormToEmail ?? 'manager@raceandrallyaustralia.com.au').trim();
  },

  async saveContactFormToEmail(email: string): Promise<string> {
    const res = await fetch(`${API_BASE}/settings.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'saveContactFormEmail', email }),
    });
    if (!res.ok) throw new Error(`Settings save failed: ${res.status}`);
    const data = (await res.json()) as { contactFormToEmail?: string };
    return (data.contactFormToEmail ?? email).trim();
  },

  async getSiteMode(): Promise<SiteMode> {
    const res = await fetch(`${API_BASE}/site_mode.php`, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`Site mode fetch failed: ${res.status}`);
    const data = (await res.json()) as { siteMode?: unknown };
    return normalizeSiteMode(data.siteMode);
  },

  async saveSiteMode(mode: SiteMode): Promise<SiteMode> {
    const res = await fetch(`${API_BASE}/site_mode.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'setMode', mode }),
    });
    if (!res.ok) throw new Error(`Site mode save failed: ${res.status}`);
    const data = (await res.json()) as { siteMode?: unknown };
    return normalizeSiteMode(data.siteMode);
  },
};
