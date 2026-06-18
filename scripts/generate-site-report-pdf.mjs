import fs from 'node:fs';
import path from 'node:path';
import { jsPDF } from 'jspdf';

const now = new Date();
const timestamp = now.toLocaleString('en-AU', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const dateSlug = now.toISOString().replace(/[:.]/g, '-');
const downloadsDir = 'C:/Users/Admin/Downloads';
const outputPath = path.join(downloadsDir, `site-reporting-audit-${dateSlug}.pdf`);

const sections = [
  { page: 'Home (/)', items: ['Featured Gear / online-store block still marked "launching soon".', 'Stage 2 TODO indicates default scaffold content remains.'] },
  { page: 'About (/about)', items: ['Team & Expertise section uses WIPPlaceholder and needs final content.'] },
  { page: 'Gear (/gear)', items: ['Product Catalog section uses WIPPlaceholder.', 'Top copy still references online store launching soon.'] },
  { page: 'Brands (/brands)', items: ['Brand list currently minimal (PIAA only). Additional intended brand content pending.'] },
  { page: 'PIAA (/brands/piaa)', items: ['Main hub content populated; no default placeholder block found on this page.'] },
  { page: 'Gallery (/gallery)', items: ['Complete Gallery section uses WIPPlaceholder.'] },
  { page: 'Events (/events)', items: ['Full Event Calendar section uses WIPPlaceholder.'] },
  { page: 'News (/news)', items: ['News Archive & Blog section uses WIPPlaceholder.'] },
  { page: 'Dealers (/dealers)', items: ['Dealer profiles are currently sample-style entries; full dealer profile flow still pending.'] },
  { page: 'Contact (/contact)', items: ['Contact form is implemented and functional; no default placeholder blocks detected.'] },
  { page: 'Shop (/shop)', items: ['Page is explicitly marked coming soon.', 'E-Commerce Platform section uses WIPPlaceholder.'] },
  { page: 'Cart (/cart)', items: ['Cart flow is functional; no default placeholder blocks detected.'] },
  { page: 'Terms (/terms)', items: ['Terms content is populated; no default placeholder blocks detected.'] },
];

const doc = new jsPDF({ unit: 'pt', format: 'a4' });
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const margin = 48;
const usableWidth = pageWidth - margin * 2;
let y = margin;

const ensureSpace = (needed = 24) => {
  if (y + needed > pageHeight - margin) {
    doc.addPage();
    y = margin;
  }
};

doc.setFont('helvetica', 'bold');
doc.setFontSize(18);
doc.text('Site Reporting Audit', margin, y);
y += 26;

doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
const intro = doc.splitTextToSize(
  'Audit scope: top-menu pages and form/components that still contain default, WIP, placeholder, or coming-soon content.',
  usableWidth,
);
doc.text(intro, margin, y);
y += intro.length * 14 + 10;

sections.forEach((section) => {
  ensureSpace(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(section.page, margin, y);
  y += 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Components needing update:', margin, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  section.items.forEach((item) => {
    const wrapped = doc.splitTextToSize(`• ${item}`, usableWidth - 10);
    ensureSpace(wrapped.length * 12 + 8);
    doc.text(wrapped, margin + 10, y);
    y += wrapped.length * 12 + 2;
  });

  y += 6;
});

ensureSpace(30);
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text(`Report created: ${timestamp}`, margin, y);

const pdfBytes = doc.output('arraybuffer');
fs.writeFileSync(outputPath, Buffer.from(pdfBytes));

console.log(outputPath);
