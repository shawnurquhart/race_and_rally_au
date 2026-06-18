const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/assets/backend/api';
const LOCAL_CONTACT_SUBMISSIONS_KEY = 'rra_local_contact_submissions';

export type ContactSubmission = {
  id: number;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  inquiry_type: string | null;
  vehicle_details: string | null;
  preferred_contact: string | null;
  subject: string | null;
  message: string;
  newsletter_opt_in: number;
  vendor_interest: number;
  ip_address: string;
  country_code: string | null;
  country_name: string | null;
  geo_lookup_status: string | null;
  geo_lookup_provider: string | null;
  status: string;
};

type ContactPayload = {
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  inquiryType?: string;
  vehicleDetails?: string;
  preferredContact?: string;
  subject?: string;
  message: string;
  newsletterOptIn?: boolean;
  vendorInterest?: boolean;
};

const readLocalSubmissions = (): ContactSubmission[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_CONTACT_SUBMISSIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalSubmission = (payload: ContactPayload): void => {
  if (typeof window === 'undefined') return;
  const records = readLocalSubmissions();
  const record: ContactSubmission = {
    id: Date.now(),
    created_at: new Date().toISOString(),
    full_name: payload.fullName,
    email: payload.email,
    phone: payload.phone || null,
    company: payload.company || null,
    inquiry_type: payload.inquiryType || 'General enquiry',
    vehicle_details: payload.vehicleDetails || null,
    preferred_contact: payload.preferredContact || 'email',
    subject: payload.subject || null,
    message: payload.message,
    newsletter_opt_in: payload.newsletterOptIn ? 1 : 0,
    vendor_interest: payload.vendorInterest ? 1 : 0,
    ip_address: 'local-dev',
    country_code: null,
    country_name: 'Local development',
    geo_lookup_status: 'local_dev_fallback',
    geo_lookup_provider: null,
    status: 'new',
  };
  window.localStorage.setItem(LOCAL_CONTACT_SUBMISSIONS_KEY, JSON.stringify([record, ...records]));
};

const parseApiJson = async <T>(res: Response): Promise<T> => {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON API response, received ${contentType || 'unknown content type'}`);
  }
  return (await res.json()) as T;
};

export const contactService = {
  async submit(payload: ContactPayload): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/contact_submissions.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', ...payload }),
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error(`Contact submit failed: ${res.status}`);
      const data = await parseApiJson<{ ok?: boolean; error?: string }>(res);
      if (data.ok !== true) throw new Error(data.error || 'Contact submit failed');
    } catch (error) {
      if (import.meta.env.DEV) {
        writeLocalSubmission(payload);
        return;
      }
      throw error;
    }
  },

  async listAdmin(): Promise<ContactSubmission[]> {
    try {
      const res = await fetch(`${API_BASE}/contact_submissions.php`, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`Contact list failed: ${res.status}`);
      const data = await parseApiJson<{ records?: ContactSubmission[] }>(res);
      const apiRecords = Array.isArray(data.records) ? data.records : [];
      return import.meta.env.DEV ? [...readLocalSubmissions(), ...apiRecords] : apiRecords;
    } catch (error) {
      if (import.meta.env.DEV) return readLocalSubmissions();
      throw error;
    }
  },

  async deleteOne(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/contact_submissions.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
      credentials: 'same-origin',
    });
    if (!res.ok) throw new Error(`Contact delete failed: ${res.status}`);
  },

  async deleteMany(ids: number[]): Promise<void> {
    const res = await fetch(`${API_BASE}/contact_submissions.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteMany', ids }),
      credentials: 'same-origin',
    });
    if (!res.ok) throw new Error(`Contact bulk delete failed: ${res.status}`);
  },
};
