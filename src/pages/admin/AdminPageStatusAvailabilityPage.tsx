import React from 'react';
import AdminLayout from './AdminLayout';
import { pageStatusService, type PageStatusRow } from '@/services/pageStatusService';

const AdminPageStatusAvailabilityPage: React.FC = () => {
  const [rows, setRows] = React.useState<PageStatusRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await pageStatusService.list();
      setRows(data);
      setMessage('');
    } catch {
      setMessage('Unable to load page status data.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const updateRow = (pageKey: string, patch: Partial<PageStatusRow>) => {
    setRows((prev) => prev.map((row) => (row.pageKey === pageKey ? { ...row, ...patch } : row)));
  };

  const onSaveAll = async () => {
    setSaving(true);
    setMessage('');
    try {
      await pageStatusService.setManyStatus(rows.map((row) => ({
        pageKey: row.pageKey,
        label: row.label,
        routePath: row.routePath,
        kind: row.kind,
        updateStatus: row.updateStatus,
        isOnline: row.isOnline,
        notes: row.notes,
      })));
      setMessage('Saved all page availability and status changes.');
      await load();
    } catch {
      setMessage('Unable to save page status changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Page Status & Availability">
      <div className="space-y-4">
        <section className="border border-gray-800 bg-gray-950 p-4">
          <h2 className="text-xl font-heading font-bold mb-2">Page Status & Availability</h2>
          <p className="text-sm text-gray-400">
            Manage every page/form update status, whether it is online/offline, and notes about required changes.
            Offline pages should be removed from site menus automatically.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <button className="btn-secondary text-xs px-3 py-2" onClick={() => void load()} disabled={loading || saving}>Refresh</button>
            <button className="btn-primary text-xs px-3 py-2" onClick={() => void onSaveAll()} disabled={loading || saving}>
              {saving ? 'Saving…' : 'Save All Changes'}
            </button>
            {message ? <p className="text-xs text-motorsport-yellow">{message}</p> : null}
          </div>
        </section>

        <section className="border border-gray-800 bg-gray-950 p-4">
          <div className="overflow-x-auto border border-gray-800">
            <table className="w-full text-xs min-w-[1200px]">
              <thead className="bg-gray-900 text-gray-300">
                <tr>
                  <th className="text-left p-2">Item</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Route</th>
                  <th className="text-left p-2">Page Status</th>
                  <th className="text-left p-2">Online / Offline</th>
                  <th className="text-left p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.pageKey} className="border-t border-gray-800 align-top">
                    <td className="p-2 whitespace-nowrap font-medium">{row.label}</td>
                    <td className="p-2 whitespace-nowrap uppercase text-[10px] text-gray-400">{row.kind}</td>
                    <td className="p-2 whitespace-nowrap text-gray-400">{row.routePath ?? '-'}</td>
                    <td className="p-2 whitespace-nowrap">
                      <select
                        className="bg-black border border-gray-700 px-2 py-1"
                        value={row.updateStatus}
                        onChange={(e) => updateRow(row.pageKey, { updateStatus: e.target.value as PageStatusRow['updateStatus'] })}
                      >
                        <option value="up_to_date">Up to date</option>
                        <option value="needs_update">Needs update</option>
                      </select>
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.isOnline}
                          onChange={(e) => updateRow(row.pageKey, { isOnline: e.target.checked })}
                        />
                        <span>{row.isOnline ? 'Online' : 'Offline'}</span>
                      </label>
                    </td>
                    <td className="p-2 min-w-[340px]">
                      <input
                        className="w-full bg-black border border-gray-700 px-2 py-1"
                        maxLength={500}
                        value={row.notes}
                        onChange={(e) => updateRow(row.pageKey, { notes: e.target.value })}
                        placeholder="Add change requirements or reason for offline status"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminPageStatusAvailabilityPage;
