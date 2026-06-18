import type { ImageUploadRegisterEntry } from '@/services/imageAssetService';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/assets/backend/api';

export const remoteUploadRegisterService = {
  async list(): Promise<ImageUploadRegisterEntry[]> {
    const res = await fetch(`${API_BASE}/upload_register.php`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.entries) ? (data.entries as ImageUploadRegisterEntry[]) : [];
  },

  async record(entry: ImageUploadRegisterEntry): Promise<void> {
    await fetch(`${API_BASE}/upload_register.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'record', entry }),
    });
  },
};
