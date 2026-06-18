import React from 'react';
import jsPDF from 'jspdf';
import AdminLayout from './AdminLayout';
import { trafficService, type TrafficLogRow, type TrafficFilters } from '@/services/trafficService';

const VISIBLE_LOG_ROWS = 20;
const TABLE_HEADER_HEIGHT_PX = 40;
const TABLE_ROW_HEIGHT_PX = 36;
type ViewMode = 'standard' | 'active';

const AdminTrafficReportingPage: React.FC = () => {
  const [logs, setLogs] = React.useState<TrafficLogRow[]>([]);
  const [pages, setPages] = React.useState<string[]>([]);
  const [page, setPage] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [sessionId, setSessionId] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [viewMode, setViewMode] = React.useState<ViewMode>('standard');
  const [activeIp, setActiveIp] = React.useState('');
  const tableViewportHeight = TABLE_HEADER_HEIGHT_PX + VISIBLE_LOG_ROWS * TABLE_ROW_HEIGHT_PX;

  const activeFilters = React.useMemo<TrafficFilters>(
    () => ({ page: page || undefined, from: from || undefined, to: to || undefined, sessionId: sessionId || undefined }),
    [from, page, sessionId, to],
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await trafficService.listLogs(activeFilters);
      setLogs(data.logs);
      setPages(data.pages);
    } catch {
      setMessage('Unable to load traffic logs. Ensure admin login is active.');
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  const ipOptions = React.useMemo(() => {
    const unique = Array.from(new Set(logs.map((row) => row.ipAddress).filter(Boolean)));
    unique.sort();
    return unique;
  }, [logs]);

  const visibleLogs = React.useMemo(() => {
    if (viewMode === 'active' && activeIp) {
      return logs.filter((row) => row.ipAddress === activeIp);
    }
    return logs;
  }, [activeIp, logs, viewMode]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const resetLogs = async () => {
    const confirmed = window.confirm('This will permanently flush all traffic logs. Continue?');
    if (!confirmed) return;
    try {
      await trafficService.resetLogs();
      setMessage('Traffic logs flushed successfully.');
      await load();
    } catch {
      setMessage('Unable to flush traffic logs.');
    }
  };

  const downloadCsv = () => {
    const a = document.createElement('a');
    a.href = trafficService.getCsvDownloadUrl(activeFilters);
    a.download = `traffic-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 24;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxLineWidth = pageWidth - margin * 2;
    let y = 36;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = 36;
      }
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Traffic Reporting', margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString('en-AU')}`, margin, y);
    y += 14;
    doc.text(`Entries: ${logs.length}`, margin, y);
    y += 18;

    logs.forEach((row, index) => {
      const line = `${index + 1}. ${row.visitedAt} | ${row.pagePath} | IP ${row.ipAddress} | Session ${row.sessionId} | View ${row.viewDurationSeconds ?? 0}s`;
      const wrapped = doc.splitTextToSize(line, maxLineWidth);
      ensureSpace(wrapped.length * 12 + 6);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 12;
      if (row.referrer) {
        const refLine = doc.splitTextToSize(`Referrer: ${row.referrer}`, maxLineWidth);
        ensureSpace(refLine.length * 10 + 4);
        doc.setFontSize(8);
        doc.text(refLine, margin + 12, y);
        y += refLine.length * 10;
        doc.setFontSize(9);
      }
      y += 6;
    });

    doc.save(`traffic-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <AdminLayout title="Traffic Reporting">
      <div className="space-y-5">
        <section className="border border-gray-800 bg-gray-950 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Page visited</label>
              <select className="w-full bg-black border border-gray-700 px-3 py-2 text-sm" value={page} onChange={(e) => setPage(e.target.value)}>
                <option value="">All pages</option>
                {pages.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">From timestamp (ISO)</label>
              <input className="w-full bg-black border border-gray-700 px-3 py-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="2026-05-01T00:00:00Z" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">To timestamp (ISO)</label>
              <input className="w-full bg-black border border-gray-700 px-3 py-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} placeholder="2026-05-18T23:59:59Z" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Session ID</label>
              <input className="w-full bg-black border border-gray-700 px-3 py-2 text-sm" value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="session filter" />
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs px-3 py-2" onClick={() => void load()} disabled={loading}>{loading ? 'Loading...' : 'Apply Filters'}</button>
              <button className="btn-secondary text-xs px-3 py-2" onClick={() => { setPage(''); setFrom(''); setTo(''); setSessionId(''); }}>Clear</button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-secondary text-xs px-3 py-2" onClick={downloadCsv}>Download CSV</button>
            <button className="btn-secondary text-xs px-3 py-2" onClick={downloadPdf}>Download PDF</button>
            <button className="btn-secondary text-xs px-3 py-2 border-red-500 text-red-300 hover:text-red-200" onClick={() => void resetLogs()}>Reset / Flush Data</button>
          </div>
          {message ? <p className="text-xs text-motorsport-yellow mt-2">{message}</p> : null}
        </section>

        <section className="border border-gray-800 bg-gray-950 p-5">
          <h2 className="text-xl font-heading font-bold mb-1">Captured Visit Log</h2>
          <p className="text-sm text-gray-400 mb-2">Showing {visibleLogs.length} visit entries (latest first).</p>
          <p className="text-xs text-gray-500 mb-4">Table viewport defaults to the first 20 log entries, then scrolls vertically.</p>

          <div className="mb-4 flex flex-wrap gap-2 items-end">
            <div className="flex gap-2">
              <button
                type="button"
                className={`btn-secondary text-xs px-3 py-2 ${viewMode === 'standard' ? 'border-motorsport-yellow text-motorsport-yellow' : ''}`}
                onClick={() => setViewMode('standard')}
              >
                Standard
              </button>
              <button
                type="button"
                className={`btn-secondary text-xs px-3 py-2 ${viewMode === 'active' ? 'border-motorsport-yellow text-motorsport-yellow' : ''}`}
                onClick={() => setViewMode('active')}
              >
                Active
              </button>
            </div>
            {viewMode === 'active' ? (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Active IP address</label>
                <select
                  className="bg-black border border-gray-700 px-3 py-2 text-sm min-w-[260px]"
                  value={activeIp}
                  onChange={(e) => setActiveIp(e.target.value)}
                >
                  <option value="">All IP addresses</option>
                  {ipOptions.map((ip) => (
                    <option key={ip} value={ip}>{ip}</option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {visibleLogs.length === 0 ? (
            <p className="text-sm text-gray-400">No traffic data available.</p>
          ) : (
            <div
              className="overflow-x-auto border border-gray-800"
              style={{ height: tableViewportHeight, overflowY: 'auto' }}
            >
              <table className="w-full text-xs min-w-[1200px]">
                <thead className="bg-gray-900 text-gray-300">
                  <tr>
                    <th className="text-left p-2">Timestamp</th>
                    <th className="text-left p-2">Page</th>
                    <th className="text-left p-2">IP Address</th>
                    <th className="text-left p-2">Country</th>
                    <th className="text-left p-2">Session</th>
                    <th className="text-left p-2">View Started</th>
                    <th className="text-left p-2">View Ended</th>
                    <th className="text-right p-2">Duration (s)</th>
                    <th className="text-left p-2">Referrer</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLogs.map((row) => (
                    <tr key={row.id} className="border-t border-gray-800 align-top h-9">
                      <td className="p-2 text-gray-300 whitespace-nowrap">{new Date(row.visitedAt).toLocaleString('en-AU')}</td>
                      <td className="p-2 text-white whitespace-nowrap">{row.pagePath}</td>
                      <td className="p-2 text-gray-300 whitespace-nowrap">{row.ipAddress}</td>
                      <td className="p-2 text-gray-300 whitespace-nowrap">{row.countryName ?? row.countryCode ?? 'Unknown'}</td>
                      <td className="p-2 text-gray-400 whitespace-nowrap">{row.sessionId}</td>
                      <td className="p-2 text-gray-400 whitespace-nowrap">{row.viewStartedAt ? new Date(row.viewStartedAt).toLocaleString('en-AU') : '-'}</td>
                      <td className="p-2 text-gray-400 whitespace-nowrap">{row.viewEndedAt ? new Date(row.viewEndedAt).toLocaleString('en-AU') : '-'}</td>
                      <td className="p-2 text-right text-motorsport-yellow whitespace-nowrap">{row.viewDurationSeconds ?? 0}</td>
                      <td className="p-2 text-gray-500 whitespace-nowrap">{row.referrer || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminTrafficReportingPage;
