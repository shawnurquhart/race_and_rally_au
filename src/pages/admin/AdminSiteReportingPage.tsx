import React from 'react';
import AdminLayout from './AdminLayout';
import { jsPDF } from 'jspdf';
import { siteReportingService, type SiteReportingStatusCode } from '@/services/siteReportingService';

type AuditSection = {
  page: string;
  route: string;
  componentsNeedingUpdate: string[];
  defaultStatus: SiteReportingStatusCode;
};

const auditSections: AuditSection[] = [
  { page: 'Home', route: '/', componentsNeedingUpdate: ['Featured Gear / Online store block still marked "launching soon" and Stage 2 TODO.'], defaultStatus: 'wip' },
  { page: 'About', route: '/about', componentsNeedingUpdate: ['Team & Expertise section uses WIPPlaceholder (default scaffold content).'], defaultStatus: 'not_started' },
  { page: 'Gear', route: '/gear', componentsNeedingUpdate: ['Product Catalog section uses WIPPlaceholder.', 'Copy still says online store launching soon.'], defaultStatus: 'not_started' },
  { page: 'Brands', route: '/brands', componentsNeedingUpdate: ['Brand list currently minimal (PIAA only); additional intended brands not populated.'], defaultStatus: 'wip' },
  { page: 'PIAA', route: '/brands/piaa', componentsNeedingUpdate: ['Main PIAA hub is populated; no default placeholder found on this page.'], defaultStatus: 'complete' },
  { page: 'Gallery', route: '/gallery', componentsNeedingUpdate: ['Complete Gallery section uses WIPPlaceholder (default scaffold content).'], defaultStatus: 'not_started' },
  { page: 'Events', route: '/events', componentsNeedingUpdate: ['Full Event Calendar section uses WIPPlaceholder.'], defaultStatus: 'not_started' },
  { page: 'News', route: '/news', componentsNeedingUpdate: ['News Archive & Blog section uses WIPPlaceholder.'], defaultStatus: 'not_started' },
  { page: 'Dealers', route: '/dealers', componentsNeedingUpdate: ['Dealer list uses sample/placeholder-style profile entries; profile pages not implemented.'], defaultStatus: 'wip' },
  { page: 'Contact', route: '/contact', componentsNeedingUpdate: ['Contact form is implemented and submitting; no default placeholder block detected.'], defaultStatus: 'wip' },
  { page: 'Shop', route: '/shop', componentsNeedingUpdate: ['Page marked as coming soon.', 'E-Commerce Platform section uses WIPPlaceholder.'], defaultStatus: 'not_started' },
  { page: 'Cart', route: '/cart', componentsNeedingUpdate: ['Functional cart implemented; no default placeholder block detected.'], defaultStatus: 'wip' },
  { page: 'Terms', route: '/terms', componentsNeedingUpdate: ['Terms content is populated; no default placeholder block detected.'], defaultStatus: 'wip' },
];

const statusMeta: Record<SiteReportingStatusCode, { label: string; className: string; pdf: { r: number; g: number; b: number } }> = {
  not_started: { label: 'Not started', className: 'bg-blue-700/30 text-blue-300 border-blue-600', pdf: { r: 52, g: 120, b: 246 } },
  wip: { label: 'Work in progress', className: 'bg-amber-700/30 text-amber-300 border-amber-600', pdf: { r: 217, g: 119, b: 6 } },
  complete: { label: 'Complete', className: 'bg-green-700/30 text-green-300 border-green-600', pdf: { r: 34, g: 197, b: 94 } },
};

const statusWordColor: Record<SiteReportingStatusCode, string> = {
  not_started: '#3478F6',
  wip: '#D97706',
  complete: '#22C55E',
};

const AdminSiteReportingPage: React.FC = () => {
  const [savedStatuses, setSavedStatuses] = React.useState<Record<string, { statusCode: SiteReportingStatusCode; commentText: string }>>({});
  const [message, setMessage] = React.useState('');
  const [modalRoute, setModalRoute] = React.useState<string | null>(null);
  const [modalStatus, setModalStatus] = React.useState<SiteReportingStatusCode>('wip');
  const [modalComment, setModalComment] = React.useState('');

  const sections = React.useMemo(
    () => auditSections.map((section) => {
      const saved = savedStatuses[section.route];
      return {
        ...section,
        currentStatus: saved?.statusCode ?? section.defaultStatus,
        currentComment: saved?.commentText ?? '',
      };
    }),
    [savedStatuses],
  );

  React.useEffect(() => {
    const load = async () => {
      try {
        const rows = await siteReportingService.listStatuses();
        const map: Record<string, { statusCode: SiteReportingStatusCode; commentText: string }> = {};
        rows.forEach((row) => {
          map[row.routeKey] = { statusCode: row.statusCode, commentText: row.commentText ?? '' };
        });
        setSavedStatuses(map);
      } catch {
        setMessage('Unable to load saved statuses.');
      }
    };
    void load();
  }, []);

  const createdAt = new Date().toLocaleString('en-AU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const onGeneratePdf = async () => {
    const now = new Date();
    const stamp = now.toLocaleString('en-AU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const fileStamp = now.toISOString().replace(/[:.]/g, '-');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 52;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const ensureRoom = (needed = 28) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    // Header logo image from Site Graphics Assets library
    try {
      const logoUrl = '/assets/site-graphics/race-and-rally-logo-1-1779260029784-1.jpg';
      const logoResp = await fetch(logoUrl);
      if (logoResp.ok) {
        const logoBlob = await logoResp.blob();
        const logoDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result ?? ''));
          reader.onerror = () => reject(new Error('Unable to read logo file'));
          reader.readAsDataURL(logoBlob);
        });

        const logoWidth = 280;
        const logoHeight = 80;
        doc.addImage(logoDataUrl, 'JPEG', margin, y - 10, logoWidth, logoHeight);
      }
    } catch {
      // Non-blocking: continue PDF generation without logo if fetch/read fails.
    }
    y += 110;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('Site Reporting Audit', margin, y);
    y += 32;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const intro = doc.splitTextToSize(
      'Audit scope: top navigation pages and forms/components that still include default, WIP, placeholder, or coming-soon content.',
      contentWidth,
    );
    doc.text(intro, margin, y);
    y += intro.length * 16 + 16;

    sections.forEach((section) => {
      ensureRoom(56);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`${section.page} (${section.route})`, margin, y);
      y += 22;

      const statusInfo = statusMeta[section.currentStatus];
      doc.setTextColor(statusInfo.pdf.r, statusInfo.pdf.g, statusInfo.pdf.b);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Status: ${statusInfo.label}`, margin, y);
      y += 16;
      // jsPDF page background is white, so body text should be black for visibility.
      doc.setTextColor(0, 0, 0);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Components needing update', margin, y);
      y += 18;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      section.componentsNeedingUpdate.forEach((item) => {
        const wrapped = doc.splitTextToSize(`• ${item}`, contentWidth - 12);
        ensureRoom(wrapped.length * 14 + 10);
        doc.text(wrapped, margin + 12, y);
        y += wrapped.length * 14 + 6;
      });

      y += 12;

      if (section.currentComment.trim() !== '') {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        const note = doc.splitTextToSize(`Comment: ${section.currentComment}`, contentWidth - 12);
        ensureRoom(note.length * 13 + 8);
        doc.text(note, margin + 12, y);
        y += note.length * 13 + 10;
      }
    });

    ensureRoom(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Report created: ${stamp}`, margin, y);

    doc.save(`site-reporting-audit-${fileStamp}.pdf`);
  };

  const onGenerateWordDoc = async () => {
    const now = new Date();
    const stamp = now.toLocaleString('en-AU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const fileStamp = now.toISOString().replace(/[:.]/g, '-');

    let logoDataUrl = '';
    try {
      const logoResp = await fetch('/assets/site-graphics/race-and-rally-logo-1-1779260029784-1.jpg');
      if (logoResp.ok) {
        const logoBlob = await logoResp.blob();
        logoDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result ?? ''));
          reader.onerror = () => reject(new Error('Unable to read logo file'));
          reader.readAsDataURL(logoBlob);
        });
      }
    } catch {
      // continue without logo
    }

    const sectionHtml = sections.map((section) => {
      const statusLabel = statusMeta[section.currentStatus].label;
      const color = statusWordColor[section.currentStatus];
      const items = section.componentsNeedingUpdate.map((item) => `<li>${item}</li>`).join('');
      const comment = section.currentComment.trim() !== ''
        ? `<p style="margin:8px 0 0;font-size:12px;color:#555;"><strong>Comment:</strong> ${section.currentComment}</p>`
        : '';
      return `
        <div style="border:1px solid #ddd;padding:12px;margin:0 0 12px;">
          <h3 style="margin:0 0 8px;font-size:16px;">${section.page} <span style="font-size:12px;color:#666;">(${section.route})</span></h3>
          <p style="margin:0 0 8px;font-size:12px;color:${color};font-weight:700;">Status: ${statusLabel}</p>
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;">Components needing update</p>
          <ul style="margin:0 0 0 18px;padding:0;font-size:12px;">${items}</ul>
          ${comment}
        </div>
      `;
    }).join('');

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Site Reporting Audit</title></head>
      <body style="font-family:Arial,sans-serif;padding:24px;color:#111;">
        ${logoDataUrl ? `<img src="${logoDataUrl}" style="width:280px;height:80px;object-fit:contain;display:block;margin-bottom:24px;" />` : ''}
        <h1 style="margin:0 0 12px;font-size:24px;">Site Reporting Audit</h1>
        <p style="margin:0 0 16px;font-size:13px;">Audit scope: top navigation pages and forms/components that still include default, WIP, placeholder, or coming-soon content.</p>
        ${sectionHtml}
        <p style="margin-top:18px;font-size:12px;"><strong>Report created:</strong> ${stamp}</p>
      </body></html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `site-reporting-audit-${fileStamp}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openModal = (route: string) => {
    const target = sections.find((s) => s.route === route);
    if (!target) return;
    setModalRoute(route);
    setModalStatus(target.currentStatus);
    setModalComment(target.currentComment);
  };

  const saveModal = async () => {
    if (!modalRoute) return;
    const target = sections.find((s) => s.route === modalRoute);
    if (!target) return;
    const cleanComment = modalComment.trim().slice(0, 100);
    try {
      await siteReportingService.setStatus({
        routeKey: target.route,
        pageName: target.page,
        statusCode: modalStatus,
        commentText: cleanComment,
      });
      setSavedStatuses((prev) => ({ ...prev, [target.route]: { statusCode: modalStatus, commentText: cleanComment } }));
      setModalRoute(null);
      setMessage(`Saved status for ${target.page}.`);
    } catch {
      setMessage('Unable to save status.');
    }
  };

  return (
    <AdminLayout title="Site Reporting">
      <div className="border border-gray-800 bg-gray-950 p-5 mb-6">
        <h2 className="text-xl font-heading font-bold mb-2">Site Content Audit Report</h2>
        <p className="text-sm text-gray-400">
          Audit scope: top navigation pages and forms/components still using original default, WIP, placeholder,
          or coming-soon content.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => void onGeneratePdf()}>
            Generate PDF to Downloads
          </button>
          <button className="btn-secondary" onClick={() => void onGenerateWordDoc()}>
            Download as Word (.doc)
          </button>
        </div>
        {message ? <p className="text-xs text-motorsport-yellow mt-3">{message}</p> : null}
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.route} className="border border-gray-800 bg-gray-900 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-heading font-bold">
                {section.page} <span className="text-sm text-gray-400 font-normal">({section.route})</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 border ${statusMeta[section.currentStatus].className}`}>
                  {statusMeta[section.currentStatus].label}
                </span>
                <button className="btn-secondary text-xs px-3 py-1" onClick={() => openModal(section.route)}>
                  Update Status
                </button>
              </div>
            </div>
            <h4 className="text-sm text-motorsport-yellow mt-3 mb-2">Components needing update</h4>
            <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1">
              {section.componentsNeedingUpdate.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {section.currentComment ? (
              <p className="text-xs text-gray-400 mt-3">
                <strong>Comment:</strong> {section.currentComment}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-6 border border-gray-800 bg-black/40 p-4 text-sm text-gray-300">
        Report created: <strong>{createdAt}</strong>
      </div>

      {modalRoute ? (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg border border-gray-700 bg-gray-950 p-5">
            <h3 className="text-lg font-heading font-bold mb-3">Update section status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Status</label>
                <select className="w-full bg-black border border-gray-700 px-3 py-2" value={modalStatus} onChange={(e) => setModalStatus(e.target.value as SiteReportingStatusCode)}>
                  <option value="not_started">Not started (blue)</option>
                  <option value="wip">Work in progress (orange)</option>
                  <option value="complete">Complete (green)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Comment (max 100 characters)</label>
                <input
                  className="w-full bg-black border border-gray-700 px-3 py-2"
                  maxLength={100}
                  value={modalComment}
                  onChange={(e) => setModalComment(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button className="btn-secondary text-xs px-3 py-2" onClick={() => setModalRoute(null)}>Cancel</button>
                <button className="btn-primary text-xs px-3 py-2" onClick={() => void saveModal()}>Save</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
};

export default AdminSiteReportingPage;
