const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/assets/backend/api';

const getCandidateApiBases = (): string[] =>
  Array.from(
    new Set([
      API_BASE,
      API_BASE.includes('/assets/backend/api') ? API_BASE.replace('/assets/backend/api', '/backend/api') : API_BASE,
      API_BASE.includes('/backend/api') ? API_BASE.replace('/backend/api', '/assets/backend/api') : API_BASE,
    ]),
  );

const requestAuth = async (
  method: 'GET' | 'POST',
  body?: Record<string, unknown>,
): Promise<{ ok: boolean; authenticated?: boolean }> => {
  const candidates = getCandidateApiBases();

  for (const base of candidates) {
    try {
      const res = await fetch(`${base}/admin_auth.php?_ts=${Date.now()}`, {
        method,
        credentials: 'include',
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
      });
      if (!res.ok) {
        continue;
      }
      const data = (await res.json()) as { authenticated?: boolean; ok?: boolean };
      return { ok: true, authenticated: Boolean(data.authenticated) };
    } catch {
      // Try next candidate base
    }
  }

  return { ok: false, authenticated: false };
};

export const adminAuthService = {
  async status(): Promise<boolean> {
    const result = await requestAuth('GET');
    return result.ok ? Boolean(result.authenticated) : false;
  },

  async login(username: string, password: string): Promise<boolean> {
    const result = await requestAuth('POST', { action: 'login', username, password });
    return result.ok ? Boolean(result.authenticated) : false;
  },

  async logout(): Promise<void> {
    await requestAuth('POST', { action: 'logout' });
  },
};
