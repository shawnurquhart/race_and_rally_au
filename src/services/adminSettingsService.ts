const STORAGE_KEY = 'rra_admin_settings_v1';
export const ADMIN_SETTINGS_UPDATED_EVENT = 'rra_admin_settings_updated';

export interface AdminUploadSettings {
  smallProductDisplaySizePx: number;
  productDetailDisplaySizePx: number;
  maxImageSizeKb: number;
  showGearOnMenu: boolean;
  showBrandsOnMenu: boolean;
}

const DEFAULT_SETTINGS: AdminUploadSettings = {
  smallProductDisplaySizePx: 100,
  productDetailDisplaySizePx: 400,
  maxImageSizeKb: 200,
  showGearOnMenu: true,
  showBrandsOnMenu: true,
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const sanitize = (value: Partial<AdminUploadSettings> | null | undefined): AdminUploadSettings => ({
  smallProductDisplaySizePx: clamp(Number(value?.smallProductDisplaySizePx ?? DEFAULT_SETTINGS.smallProductDisplaySizePx), 60, 300),
  productDetailDisplaySizePx: clamp(Number(value?.productDetailDisplaySizePx ?? DEFAULT_SETTINGS.productDetailDisplaySizePx), 180, 900),
  maxImageSizeKb: clamp(Number(value?.maxImageSizeKb ?? DEFAULT_SETTINGS.maxImageSizeKb), 80, 2048),
  showGearOnMenu: value?.showGearOnMenu ?? DEFAULT_SETTINGS.showGearOnMenu,
  showBrandsOnMenu: value?.showBrandsOnMenu ?? DEFAULT_SETTINGS.showBrandsOnMenu,
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
    window.dispatchEvent(new CustomEvent(ADMIN_SETTINGS_UPDATED_EVENT, { detail: merged }));
    return merged;
  },

  defaults(): AdminUploadSettings {
    return DEFAULT_SETTINGS;
  },
};
