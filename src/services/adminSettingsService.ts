const STORAGE_KEY = 'rra_admin_settings_v1';

export interface AdminUploadSettings {
  smallProductDisplaySizePx: number;
  productDetailDisplaySizePx: number;
  maxImageSizeKb: number;
}

const DEFAULT_SETTINGS: AdminUploadSettings = {
  smallProductDisplaySizePx: 100,
  productDetailDisplaySizePx: 400,
  maxImageSizeKb: 200,
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const sanitize = (value: Partial<AdminUploadSettings> | null | undefined): AdminUploadSettings => ({
  smallProductDisplaySizePx: clamp(Number(value?.smallProductDisplaySizePx ?? DEFAULT_SETTINGS.smallProductDisplaySizePx), 60, 300),
  productDetailDisplaySizePx: clamp(Number(value?.productDetailDisplaySizePx ?? DEFAULT_SETTINGS.productDetailDisplaySizePx), 180, 900),
  maxImageSizeKb: clamp(Number(value?.maxImageSizeKb ?? DEFAULT_SETTINGS.maxImageSizeKb), 80, 2048),
});

export const adminSettingsService = {
  get(): AdminUploadSettings {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<AdminUploadSettings>;
      return sanitize(parsed);
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  update(next: Partial<AdminUploadSettings>): AdminUploadSettings {
    const merged = sanitize({ ...this.get(), ...next });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  },

  defaults(): AdminUploadSettings {
    return DEFAULT_SETTINGS;
  },
};
