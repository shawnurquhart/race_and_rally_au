const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/assets/backend/api';

export type SiteReportingStatusCode = 'not_started' | 'wip' | 'complete';

export interface SiteReportingStatusRow {
  routeKey: string;
  pageName: string;
  statusCode: SiteReportingStatusCode;
  commentText: string | null;
  updatedAt: string;
}

export const siteReportingService = {
  async listStatuses(): Promise<SiteReportingStatusRow[]> {
    const res = await fetch(`${API_BASE}/site_reporting.php`, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`Load failed: ${res.status}`);
    const data = (await res.json()) as { rows?: Array<{ route_key: string; page_name: string; status_code: SiteReportingStatusCode; comment_text: string | null; updated_at: string; }>; };
    return (data.rows ?? []).map((row) => ({
      routeKey: row.route_key,
      pageName: row.page_name,
      statusCode: row.status_code,
      commentText: row.comment_text,
      updatedAt: row.updated_at,
    }));
  },

  async setStatus(payload: { routeKey: string; pageName: string; statusCode: SiteReportingStatusCode; commentText: string; }): Promise<void> {
    const res = await fetch(`${API_BASE}/site_reporting.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'setStatus', ...payload }),
    });
    if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  },
};
