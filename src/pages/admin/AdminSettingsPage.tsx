import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { adminSettingsService, type AdminUploadSettings } from '@/services/adminSettingsService';

const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AdminUploadSettings>(() => adminSettingsService.get());
  const [message, setMessage] = useState('');

  const onNumberChange = (key: keyof AdminUploadSettings, value: string) => {
    const parsed = Number(value);
    setSettings((previous) => ({
      ...previous,
      [key]: Number.isFinite(parsed) ? parsed : 0,
    }));
  };

  const onSave = () => {
    const saved = adminSettingsService.update(settings);
    setSettings(saved);
    setMessage('Settings saved. Upload and display behavior updated.');
  };

  return (
    <AdminLayout title="Settings">
      <div className="space-y-6">
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
          {message && <p className="text-sm text-gray-300 mt-3">{message}</p>}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
