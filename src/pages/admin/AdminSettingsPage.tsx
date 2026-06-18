import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { adminSettingsService, type AdminUploadSettings } from '@/services/adminSettingsService';
import { adminSystemSettingsService, type SiteMode } from '@/services/adminSystemSettingsService';
import { productService } from '@/services/productService';
import { imageAssetService } from '@/services/imageAssetService';

type NumericSettingKey = 'smallProductDisplaySizePx' | 'productDetailDisplaySizePx' | 'productModalDisplaySizePx' | 'maxImageSizeKb';
type MenuToggleSettingKey = 'showGearOnMenu' | 'showBrandsOnMenu';
const RESET_CONFIRM_TEXT = 'RESET PIAA DATA';
const SITE_GRAPHICS_ROOT = 'assets/site-graphics';

type SiteGraphicEntry = {
  path: string;
  size: number;
  modifiedAt: string;
};

const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AdminUploadSettings>(() => adminSettingsService.get());
  const [settingsMessage, setSettingsMessage] = useState('');
  const [contactFormMessage, setContactFormMessage] = useState('');
  const [siteModeMessage, setSiteModeMessage] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [contactFormToEmail, setContactFormToEmail] = useState('manager@raceandrallyaustralia.com.au');
  const [siteMode, setSiteMode] = useState<SiteMode>('standard');
  const [contactSettingsLoading, setContactSettingsLoading] = useState(true);
  const [resetConfirmationInput, setResetConfirmationInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [siteGraphics, setSiteGraphics] = useState<SiteGraphicEntry[]>([]);
  const [siteGraphicsMessage, setSiteGraphicsMessage] = useState('');
  const [siteGraphicsLoading, setSiteGraphicsLoading] = useState(false);
  const [selectedGraphic, setSelectedGraphic] = useState<SiteGraphicEntry | null>(null);
  const [copyAcknowledged, setCopyAcknowledged] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        const email = await adminSystemSettingsService.getContactFormToEmail();
        const currentMode = await adminSystemSettingsService.getSiteMode();
        setContactFormToEmail(email);
        setSiteMode(currentMode);
      } finally {
        setContactSettingsLoading(false);
      }
    };
    void load();
  }, []);

  const loadSiteGraphics = React.useCallback(async () => {
    setSiteGraphicsLoading(true);
    try {
      const res = await fetch(`/assets/backend/api/files_manifest.php?path=${encodeURIComponent(SITE_GRAPHICS_ROOT)}&max=5000`, {
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('manifest failed');
      const data = (await res.json()) as { entries?: Array<{ type: string; path: string; size: number; modifiedAt: string }> };
      const files = (data.entries ?? [])
        .filter((entry) => entry.type === 'file')
        .map((entry) => ({ path: entry.path, size: entry.size, modifiedAt: entry.modifiedAt }))
        .sort((a, b) => a.path.localeCompare(b.path));
      setSiteGraphics(files);
    } catch {
      setSiteGraphicsMessage('Unable to load Site Graphics Assets library.');
    } finally {
      setSiteGraphicsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadSiteGraphics();
  }, [loadSiteGraphics]);

  const sanitizeAssetName = (name: string) =>
    name
      .toLowerCase()
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'site-asset';

  const convertToJpgFile = async (file: File): Promise<File> => {
    if (file.type === 'image/jpeg') return file;
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = objectUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas unavailable');
      ctx.drawImage(img, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      if (!blob) throw new Error('jpg conversion failed');
      return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const onUploadSiteGraphics = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setSiteGraphicsMessage('');
    try {
      const form = new FormData();
      form.append('root', SITE_GRAPHICS_ROOT);
      form.append('replace', 'false');

      for (const [index, original] of files.entries()) {
        const jpgFile = await convertToJpgFile(original);
        const base = sanitizeAssetName(jpgFile.name);
        const uniqueName = `${base}-${Date.now()}-${index + 1}.jpg`;
        const finalFile = new File([jpgFile], uniqueName, { type: 'image/jpeg' });
        form.append('files[]', finalFile);
      }

      const res = await fetch('/assets/backend/api/files_upload.php', {
        method: 'POST',
        credentials: 'same-origin',
        body: form,
      });
      if (!res.ok) throw new Error('upload failed');
      const data = (await res.json()) as { uploadedCount?: number; skippedCount?: number; failedCount?: number };
      setSiteGraphicsMessage(`Upload complete. Uploaded: ${data.uploadedCount ?? 0}, skipped: ${data.skippedCount ?? 0}, failed: ${data.failedCount ?? 0}.`);
      await loadSiteGraphics();
    } catch {
      setSiteGraphicsMessage('Upload failed for Site Graphics Assets.');
    } finally {
      event.target.value = '';
    }
  };

  const copyFilename = async (entry: SiteGraphicEntry) => {
    const fileName = entry.path.split('/').pop() ?? entry.path;
    await navigator.clipboard.writeText(fileName);
    setSiteGraphicsMessage(`Copied: ${fileName}`);
    setCopyAcknowledged(true);
    window.setTimeout(() => setCopyAcknowledged(false), 1800);
  };

  const onDeleteSiteGraphic = async (entry: SiteGraphicEntry) => {
    const fileName = entry.path.split('/').pop() ?? entry.path;
    const confirmed = window.confirm(`Are you sure you want to remove "${fileName}" from the library?`);
    if (!confirmed) return;

    setDeletingPath(entry.path);
    try {
      const res = await fetch('/assets/backend/api/files_delete.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          root: SITE_GRAPHICS_ROOT,
          files: [entry.path],
        }),
      });
      if (!res.ok) throw new Error('delete failed');
      setSiteGraphicsMessage(`Removed: ${fileName}`);
      if (selectedGraphic?.path === entry.path) {
        setSelectedGraphic(null);
      }
      await loadSiteGraphics();
    } catch {
      setSiteGraphicsMessage(`Unable to remove: ${fileName}`);
    } finally {
      setDeletingPath(null);
    }
  };

  const onNumberChange = (key: NumericSettingKey, value: string) => {
    const parsed = Number(value);
    setSettings((previous) => ({
      ...previous,
      [key]: Number.isFinite(parsed) ? parsed : 0,
    }));
  };

  const onToggleChange = (key: MenuToggleSettingKey, checked: boolean) => {
    setSettings((previous) => ({
      ...previous,
      [key]: checked,
    }));
  };

  const onSave = () => {
    const saved = adminSettingsService.update(settings);
    setSettings(saved);
    setSettingsMessage('Settings saved. Upload and display behavior updated.');
  };

  const onSaveContactFormEmail = async () => {
    const next = contactFormToEmail.trim();
    if (!next || !/^\S+@\S+\.\S+$/.test(next)) {
      setContactFormMessage('Please enter a valid contact notification email address.');
      return;
    }
    try {
      const saved = await adminSystemSettingsService.saveContactFormToEmail(next);
      setContactFormToEmail(saved);
      setContactFormMessage('Contact form email setting saved.');
    } catch {
      setContactFormMessage('Unable to save contact form email setting.');
    }
  };

  const onSaveSiteMode = async () => {
    try {
      const saved = await adminSystemSettingsService.saveSiteMode(siteMode);
      setSiteMode(saved);
      setSiteModeMessage('Site mode saved.');
    } catch {
      setSiteModeMessage('Unable to save site mode.');
    }
  };

  const onResetPiaaData = async () => {
    if (resetConfirmationInput.trim() !== RESET_CONFIRM_TEXT) {
      setResetMessage(`Type \"${RESET_CONFIRM_TEXT}\" exactly to enable full reset.`);
      return;
    }

    setIsResetting(true);
    try {
      await productService.clear();
      imageAssetService.clear();
      localStorage.removeItem('rra_spreadsheet_alert_rules_v1');
      localStorage.removeItem('rra_cart_v1');
      localStorage.removeItem('rra_orders_v1');
      setResetConfirmationInput('');
      setResetMessage('PIAA reset complete: products, graphics assets, spreadsheet rules, cart and orders were cleared.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AdminLayout title="Settings">
      <div className="space-y-6">
        <div className="border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-xl font-heading font-bold mb-3">Site Visibility Mode</h2>
          <p className="text-sm text-gray-400 mb-5">
            Choose which public state this website should run in.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-300 mb-1" htmlFor="site-mode-select">
                Site mode
              </label>
              <select
                id="site-mode-select"
                className="w-full bg-black border border-gray-700 px-3 py-2"
                value={siteMode}
                disabled={contactSettingsLoading}
                onChange={(event) => setSiteMode(event.target.value as SiteMode)}
              >
                <option value="standard">Standard (admin visible)</option>
                <option value="hide_admin">Hide Admin (public-only)</option>
                <option value="update_mode">Update Mode (maintenance message)</option>
              </select>
            </div>
            <div>
              <button onClick={() => void onSaveSiteMode()} className="btn-primary" disabled={contactSettingsLoading}>
                {contactSettingsLoading ? 'Loading...' : 'Save Site Mode'}
              </button>
              {siteModeMessage ? <p className="text-sm text-gray-300 mt-3">{siteModeMessage}</p> : null}
            </div>
          </div>
        </div>

        <div className="border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-xl font-heading font-bold mb-3">Contact Form</h2>
          <p className="text-sm text-gray-400 mb-5">
            Set the destination email address for new contact form submissions.
            Default: <strong>manager@raceandrallyaustralia.com.au</strong>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-300 mb-1" htmlFor="contact-form-to-email">
                Contact form recipient email
              </label>
              <input
                id="contact-form-to-email"
                type="email"
                className="w-full bg-black border border-gray-700 px-3 py-2"
                value={contactFormToEmail}
                disabled={contactSettingsLoading}
                onChange={(event) => setContactFormToEmail(event.target.value)}
                placeholder="manager@raceandrallyaustralia.com.au"
              />
            </div>
            <div>
              <button onClick={() => void onSaveContactFormEmail()} className="btn-primary" disabled={contactSettingsLoading}>
                {contactSettingsLoading ? 'Loading...' : 'Save Contact Form Email'}
              </button>
              {contactFormMessage ? <p className="text-sm text-gray-300 mt-3">{contactFormMessage}</p> : null}
            </div>
          </div>
        </div>

        <div className="border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-xl font-heading font-bold mb-3">Site Graphics Assets</h2>
          <p className="text-sm text-gray-400 mb-5">
            This is used for uploading any graphics into a library required to supply site-specific graphics like
            <strong> Site logo</strong> and other similar assets required to be utilised.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <label className="btn-primary cursor-pointer">
              Upload from computer folder
              <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => void onUploadSiteGraphics(event)} />
            </label>
            <button className="btn-secondary" onClick={() => void loadSiteGraphics()} disabled={siteGraphicsLoading}>
              {siteGraphicsLoading ? 'Loading...' : 'Refresh library'}
            </button>
          </div>

          {siteGraphicsMessage ? <p className="text-sm text-gray-300 mb-3">{siteGraphicsMessage}</p> : null}

          <div className="border border-gray-800 bg-black/40 p-3 max-h-80 overflow-y-auto">
            {siteGraphics.length === 0 ? (
              <p className="text-sm text-gray-400">No graphics uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {siteGraphics.map((entry) => {
                  const fileName = entry.path.split('/').pop() ?? entry.path;
                  const resourceUrl = `/${SITE_GRAPHICS_ROOT}/${fileName}`;
                  return (
                    <div key={entry.path} className="w-full border border-gray-800 bg-gray-900 px-3 py-2">
                      <div className="flex items-start gap-2">
                        <button
                          className="flex-1 text-left hover:text-motorsport-yellow"
                          onClick={() => setSelectedGraphic(entry)}
                        >
                          <p className="text-sm text-white truncate">{fileName}</p>
                          <p className="text-xs text-gray-400 truncate">{resourceUrl}</p>
                        </button>
                        <button
                          className="text-red-300 hover:text-red-200 border border-red-700/60 px-2 py-1 text-xs"
                          title="Delete from library"
                          disabled={deletingPath === entry.path}
                          onClick={() => void onDeleteSiteGraphic(entry)}
                        >
                          {deletingPath === entry.path ? '...' : '🗑'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-xl font-heading font-bold mb-3">Uploading files and photos</h2>
          <p className="text-sm text-gray-400 mb-5">
            Configure layout values used on the website for product listing and product detail display.
            Also configure the default max upload size before automatic compression.
          </p>

          <div className="mb-5 border border-gray-800 bg-black/40 p-3 text-sm text-gray-300 space-y-1">
            <p>
              <span className="text-motorsport-yellow">Product Display - Listing form</span> - current value display{' '}
              <strong>{settings.smallProductDisplaySizePx} x {settings.smallProductDisplaySizePx} pixels</strong>
            </p>
            <p>
              <span className="text-motorsport-yellow">Product Display - detail page - display size</span> - current value{' '}
              <strong>{settings.productDetailDisplaySizePx} x {settings.productDetailDisplaySizePx} pixels</strong>
            </p>
            <p>
              <span className="text-motorsport-yellow">Max graphics upload size before compression</span> - current value{' '}
              <strong>{settings.maxImageSizeKb}KB</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1" htmlFor="small-image-size">
                Product Display - Listing form (px)
              </label>
              <input
                id="small-image-size"
                type="number"
                min={60}
                max={300}
                className="w-full bg-black border border-gray-700 px-3 py-2"
                value={settings.smallProductDisplaySizePx}
                onChange={(event) => onNumberChange('smallProductDisplaySizePx', event.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1" htmlFor="detail-image-size">
                Product Display - detail page - display size (px)
              </label>
              <input
                id="detail-image-size"
                type="number"
                min={180}
                max={900}
                className="w-full bg-black border border-gray-700 px-3 py-2"
                value={settings.productDetailDisplaySizePx}
                onChange={(event) => onNumberChange('productDetailDisplaySizePx', event.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1" htmlFor="max-image-kb">
                Max size of graphics uploaded before compression (KB)
              </label>
              <input
                id="max-image-kb"
                type="number"
                min={80}
                max={2048}
                className="w-full bg-black border border-gray-700 px-3 py-2"
                value={settings.maxImageSizeKb}
                onChange={(event) => onNumberChange('maxImageSizeKb', event.target.value)}
              />
            </div>
          </div>

          <button onClick={onSave} className="btn-primary mt-5">
            Save Settings
          </button>
          {settingsMessage && <p className="text-sm text-gray-300 mt-3">{settingsMessage}</p>}
        </div>

        <div className="border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-xl font-heading font-bold mb-3">Display Settings</h2>
          <p className="text-sm text-gray-400 mb-5">
            Configure the large modal image shown when clicking product images in catalogue cards.
          </p>

          <div className="mb-5 border border-gray-800 bg-black/40 p-3 text-sm text-gray-300 space-y-1">
            <p>
              <span className="text-motorsport-yellow">Product Modal - display size</span> - current value{' '}
              <strong>{settings.productModalDisplaySizePx} x {settings.productModalDisplaySizePx} pixels</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1" htmlFor="product-modal-size">
                Product Modal - display size (px)
              </label>
              <input
                id="product-modal-size"
                type="number"
                min={320}
                max={1600}
                className="w-full bg-black border border-gray-700 px-3 py-2"
                value={settings.productModalDisplaySizePx}
                onChange={(event) => onNumberChange('productModalDisplaySizePx', event.target.value)}
              />
            </div>
          </div>

          <button onClick={onSave} className="btn-primary mt-5">
            Save Settings
          </button>
          {settingsMessage && <p className="text-sm text-gray-300 mt-3">{settingsMessage}</p>}
        </div>

        <div className="border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-xl font-heading font-bold mb-3">Site configuration</h2>
          <p className="text-sm text-gray-400 mb-5">
            Control whether selected sections appear in the website menu.
          </p>

          <div className="space-y-4">
            <label className="flex items-center justify-between border border-gray-800 bg-black/40 px-4 py-3">
              <span className="text-sm text-gray-200">Show on menu: Gear</span>
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={settings.showGearOnMenu}
                onChange={(event) => onToggleChange('showGearOnMenu', event.target.checked)}
              />
            </label>

            <label className="flex items-center justify-between border border-gray-800 bg-black/40 px-4 py-3">
              <span className="text-sm text-gray-200">Show on menu: Brands</span>
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={settings.showBrandsOnMenu}
                onChange={(event) => onToggleChange('showBrandsOnMenu', event.target.checked)}
              />
            </label>
          </div>

          <button onClick={onSave} className="btn-primary mt-5">
            Save Settings
          </button>
          {settingsMessage && <p className="text-sm text-gray-300 mt-3">{settingsMessage}</p>}
        </div>

        <div className="border border-red-700 bg-red-950/30 p-5">
          <h2 className="text-xl font-heading font-bold mb-3 text-red-300">Danger zone - reset PIAA system data</h2>
          <p className="text-sm text-red-100/90 mb-4">
            This permanently clears locally stored PIAA product records (including SKU/name/category/pricing),
            uploaded image assets/references, spreadsheet alert rule settings, cart data, and locally stored orders.
            This action cannot be undone.
          </p>

          <div className="space-y-3 max-w-xl">
            <label className="block text-sm text-red-100" htmlFor="reset-confirmation">
              Type <strong>{RESET_CONFIRM_TEXT}</strong> to confirm
            </label>
            <input
              id="reset-confirmation"
              className="w-full bg-black border border-red-600 px-3 py-2 text-red-100"
              value={resetConfirmationInput}
              onChange={(event) => setResetConfirmationInput(event.target.value)}
              placeholder={RESET_CONFIRM_TEXT}
            />
            <button
              onClick={() => void onResetPiaaData()}
              disabled={isResetting || resetConfirmationInput.trim() !== RESET_CONFIRM_TEXT}
              className="btn-secondary disabled:opacity-50"
            >
              {isResetting ? 'Resetting...' : 'Reset PIAA Data'}
            </button>
            {resetMessage ? <p className="text-sm text-red-100 mt-2">{resetMessage}</p> : null}
          </div>
        </div>
      </div>

      {selectedGraphic ? (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl border border-gray-700 bg-gray-950 p-4">
            <div className="flex items-center justify-between mb-3 gap-3">
              <h3 className="text-lg font-heading font-bold truncate">{selectedGraphic.path.split('/').pop()}</h3>
              <button className="btn-secondary text-xs" onClick={() => setSelectedGraphic(null)}>Close</button>
            </div>
            <div className="max-h-[70vh] overflow-auto border border-gray-800 bg-black flex items-center justify-center">
              <img
                src={`/${SITE_GRAPHICS_ROOT}/${selectedGraphic.path.split('/').pop()}`}
                alt={selectedGraphic.path}
                className="max-w-full h-auto"
              />
            </div>
            <div className="mt-3 flex justify-end">
              <div className="flex items-center gap-3">
                {copyAcknowledged ? <span className="text-xs text-green-300">Copied to clipboard ✓</span> : null}
                <button className="btn-primary text-xs" onClick={() => void copyFilename(selectedGraphic)}>
                  {copyAcknowledged ? 'Copied' : 'Copy resource file name to clipboard'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
};

export default AdminSettingsPage;
