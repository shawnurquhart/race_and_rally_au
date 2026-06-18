import React from 'react';
import AdminLayout from './AdminLayout';
import { contactService, type ContactSubmission } from '@/services/contactService';

const AdminContactSubmissionsPage: React.FC = () => {
  const [records, setRecords] = React.useState<ContactSubmission[]>([]);
  const [selected, setSelected] = React.useState<number[]>([]);
  const [message, setMessage] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      const data = await contactService.listAdmin();
      setRecords(data);
    } catch {
      setMessage('Unable to load contact submissions.');
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const toggle = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const copyRecord = async (r: ContactSubmission) => {
    const text = [
      `Name: ${r.full_name}`,
      `Email: ${r.email}`,
      `Phone: ${r.phone ?? ''}`,
      `Company: ${r.company ?? ''}`,
      `Inquiry: ${r.inquiry_type ?? ''}`,
      `Subject: ${r.subject ?? ''}`,
      `Preferred Contact: ${r.preferred_contact ?? ''}`,
      `Vehicle: ${r.vehicle_details ?? ''}`,
      `Newsletter: ${r.newsletter_opt_in ? 'Yes' : 'No'}`,
      `Vendor Interest: ${r.vendor_interest ? 'Yes' : 'No'}`,
      `IP: ${r.ip_address}`,
      `Country: ${r.country_name ?? 'Unknown'}`,
      `Message: ${r.message}`,
    ].join('\n');
    await navigator.clipboard.writeText(text);
    setMessage('Copied submission details.');
  };

  const deleteOne = async (id: number) => {
    await contactService.deleteOne(id);
    setSelected((prev) => prev.filter((x) => x !== id));
    await load();
  };

  const deleteSelected = async () => {
    if (!selected.length) return;
    await contactService.deleteMany(selected);
    setSelected([]);
    await load();
  };

  return (
    <AdminLayout title="Contact Submissions">
      <div className="space-y-4">
        <section className="border border-gray-800 bg-gray-950 p-4 flex flex-wrap gap-2 items-center">
          <button className="btn-secondary text-xs px-3 py-2" onClick={() => void load()}>Refresh</button>
          <button className="btn-secondary text-xs px-3 py-2 border-red-500 text-red-300" onClick={() => void deleteSelected()} disabled={!selected.length}>Delete Selected</button>
          <p className="text-xs text-gray-400">{records.length} records</p>
          {message ? <p className="text-xs text-motorsport-yellow">{message}</p> : null}
        </section>

        <section className="border border-gray-800 bg-gray-950 p-4">
          <div className="overflow-x-auto border border-gray-800">
            <table className="w-full text-xs min-w-[1500px]">
              <thead className="bg-gray-900 text-gray-300">
                <tr>
                  <th className="p-2" />
                  <th className="text-left p-2">Created</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Phone</th>
                  <th className="text-left p-2">Company</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Subject</th>
                  <th className="text-left p-2">Message</th>
                  <th className="text-left p-2">Newsletter</th>
                  <th className="text-left p-2">Vendor</th>
                  <th className="text-left p-2">IP</th>
                  <th className="text-left p-2">Country</th>
                  <th className="text-left p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-t border-gray-800 align-top">
                    <td className="p-2"><input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} /></td>
                    <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString('en-AU')}</td>
                    <td className="p-2 whitespace-nowrap">{r.full_name}</td>
                    <td className="p-2 whitespace-nowrap">{r.email}</td>
                    <td className="p-2 whitespace-nowrap">{r.phone ?? '-'}</td>
                    <td className="p-2 whitespace-nowrap">{r.company ?? '-'}</td>
                    <td className="p-2 whitespace-nowrap">{r.inquiry_type ?? '-'}</td>
                    <td className="p-2 whitespace-nowrap">{r.subject ?? '-'}</td>
                    <td className="p-2 min-w-[280px]">{r.message}</td>
                    <td className="p-2 whitespace-nowrap">{r.newsletter_opt_in ? 'Yes' : 'No'}</td>
                    <td className="p-2 whitespace-nowrap">{r.vendor_interest ? 'Yes' : 'No'}</td>
                    <td className="p-2 whitespace-nowrap">{r.ip_address}</td>
                    <td className="p-2 whitespace-nowrap">{r.country_name ?? 'Unknown'}</td>
                    <td className="p-2 whitespace-nowrap flex gap-2">
                      <button className="btn-secondary text-xs px-2 py-1" onClick={() => void copyRecord(r)}>Copy</button>
                      <button className="btn-secondary text-xs px-2 py-1 border-red-500 text-red-300" onClick={() => void deleteOne(r.id)}>Delete</button>
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

export default AdminContactSubmissionsPage;
