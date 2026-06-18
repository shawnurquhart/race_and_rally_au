export interface BackendHealthStatus {
  ok: boolean;
  database?: string;
  tables?: Record<string, boolean>;
  error?: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/assets/backend/api';

const getCandidateApiBases = (): string[] =>
  Array.from(
    new Set([
      API_BASE,
      API_BASE.includes('/assets/backend/api') ? API_BASE.replace('/assets/backend/api', '/backend/api') : API_BASE,
      API_BASE.includes('/backend/api') ? API_BASE.replace('/backend/api', '/assets/backend/api') : API_BASE,
    ]),
  );

const requestJsonWithFallback = async <T>(endpoint: 'health.php' | 'install.php'): Promise<{ data?: T; error?: string }> => {
  const bases = getCandidateApiBases();
  let lastError = '';

  for (const base of bases) {
    try {
      const res = await fetch(`${base}/${endpoint}?_ts=${Date.now()}`);
      if (!res.ok) {
        lastError = `${endpoint} request failed (${res.status}) at ${base}`;
        continue;
      }

      const parsed = await parseJsonSafe<T>(res, endpoint === 'health.php' ? 'health' : 'install');
      if (parsed.data) {
        return parsed;
      }

      lastError = parsed.error ?? `Invalid JSON from ${base}/${endpoint}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : `Unknown request error for ${base}/${endpoint}`;
    }
  }

  return { error: lastError || `Unable to reach ${endpoint} via configured API bases.` };
};

const parseJsonSafe = async <T>(res: Response, context: 'health' | 'install'): Promise<{ data?: T; error?: string }> => {
  const raw = await res.text();
  try {
    return { data: JSON.parse(raw) as T };
  } catch {
    const snippet = raw.slice(0, 120).replace(/\s+/g, ' ').trim();
    return {
      error:
        `Invalid JSON from ${context} endpoint. ` +
        `Received non-JSON response (starts with: "${snippet}"). ` +
        `Check API path (${API_BASE}) and PHP server routing in this environment.`,
    };
  }
};

export const backendSyncService = {
  async health(): Promise<BackendHealthStatus> {
    try {
      const parsed = await requestJsonWithFallback<BackendHealthStatus>('health.php');
      if (!parsed.data) {
        return { ok: false, error: parsed.error ?? 'Health endpoint returned invalid JSON' };
      }
      return parsed.data;
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown health error' };
    }
  },

  async install(): Promise<{ ok: boolean; error?: string }> {
    try {
      const parsed = await requestJsonWithFallback<{ ok?: boolean; error?: string }>('install.php');
      if (!parsed.data) {
        return { ok: false, error: parsed.error ?? 'Install endpoint returned invalid JSON' };
      }
      const data = parsed.data;
      return { ok: Boolean(data.ok), error: data.error };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown install error' };
    }
  },
};
