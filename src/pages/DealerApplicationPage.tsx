import React from 'react';
import { CheckCircle2, Download, FileText, Send } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { contactService } from '@/services/contactService';

type DealerApplicationForm = {
  customerTypes: string[];
  date: string;
  country: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  mobile: string;
  address: string;
  accountManager: string;
  ownerName: string;
  ownersEmail: string;
  ownersMobile: string;
  abnAcn: string;
  ownedWorkshops: string;
  tradeCustomers: string;
  warehouses: string;
  drivingLampBrands: string;
  globeBrands: string;
  hornBrands: string;
  notes: string;
  vehiclesSupported: string;
  drivingLampsVolume: string;
  globeSetsVolume: string;
  hornsVolume: string;
  wipersVolume: string;
  areasOfInterest: string;
  businessRegistrationAttached: boolean;
  consent: boolean;
};

const initialForm: DealerApplicationForm = {
  customerTypes: [],
  date: new Date().toISOString().slice(0, 10),
  country: '',
  company: '',
  contact: '',
  email: '',
  phone: '',
  mobile: '',
  address: '',
  accountManager: '',
  ownerName: '',
  ownersEmail: '',
  ownersMobile: '',
  abnAcn: '',
  ownedWorkshops: '',
  tradeCustomers: '',
  warehouses: '',
  drivingLampBrands: '',
  globeBrands: '',
  hornBrands: '',
  notes: '',
  vehiclesSupported: '',
  drivingLampsVolume: '',
  globeSetsVolume: '',
  hornsVolume: '',
  wipersVolume: '',
  areasOfInterest: '',
  businessRegistrationAttached: false,
  consent: false,
};

const customerTypeOptions = ['Wholesaler', 'Dealer', 'Auto Electrician', 'Workshop'];

const buildApplicationMessage = (form: DealerApplicationForm) =>
  [
    'Dealer Application',
    `Date: ${form.date}`,
    `Customer type: ${form.customerTypes.join(', ') || 'Not selected'}`,
    '',
    'Business details',
    `Country: ${form.country}`,
    `Company: ${form.company}`,
    `Contact: ${form.contact}`,
    `Email: ${form.email}`,
    `Phone: ${form.phone}`,
    `Mobile: ${form.mobile}`,
    `Address: ${form.address}`,
    `ABN or ACN: ${form.abnAcn}`,
    '',
    'R&R / Owner details',
    `R&R Account Manager: ${form.accountManager}`,
    `Owner Name: ${form.ownerName}`,
    `Owners Email: ${form.ownersEmail}`,
    `Owners Mobile: ${form.ownersMobile}`,
    '',
    'Business profile',
    `Number of owned workshops: ${form.ownedWorkshops}`,
    `Number of trade customers, if wholesale: ${form.tradeCustomers}`,
    `Number of warehouses and locations, if wholesale: ${form.warehouses}`,
    `Brands currently sold - Driving Lamps: ${form.drivingLampBrands}`,
    `Brands currently sold - Globes: ${form.globeBrands}`,
    `Brands currently sold - Horns: ${form.hornBrands}`,
    `Any other notes: ${form.notes}`,
    `Main vehicles supported: ${form.vehiclesSupported}`,
    '',
    'Current volume per week',
    `Driving lamps: ${form.drivingLampsVolume}`,
    `Globe sets: ${form.globeSetsVolume}`,
    `Horns: ${form.hornsVolume}`,
    `Wipers: ${form.wipersVolume}`,
    `Areas of interest/opportunity: ${form.areasOfInterest}`,
    '',
    `Current business registration attached/available: ${form.businessRegistrationAttached ? 'Yes' : 'No'}`,
  ].join('\n');

const safeFileName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'dealer-application';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const pdfValue = (value: string) => escapeHtml(value.trim() || '');

const pdfField = (label: string, value: string) => `
  <div class="field">
    <div class="field-label">${escapeHtml(label)}</div>
    <div class="field-value">${pdfValue(value)}</div>
  </div>
`;

const pdfTextarea = (label: string, value: string) => `
  <div class="field field-wide">
    <div class="field-label">${escapeHtml(label)}</div>
    <div class="field-value textarea">${pdfValue(value).replace(/\n/g, '<br />')}</div>
  </div>
`;

const buildPdfElement = (form: DealerApplicationForm): HTMLDivElement => {
  const element = document.createElement('div');
  element.style.position = 'fixed';
  element.style.left = '-10000px';
  element.style.top = '0';
  element.style.width = '1120px';
  element.style.background = '#000000';
  element.style.color = '#ffffff';
  element.style.fontFamily = 'Arial, Helvetica, sans-serif';
  element.style.padding = '32px';
  element.innerHTML = `
    <style>
      .pdf-form * { box-sizing: border-box; }
      .pdf-form { background: #000; color: #fff; width: 1120px; font-family: Arial, Helvetica, sans-serif; }
      .hero { border: 1px solid #1f2937; background: #111827; padding: 32px; margin-bottom: 24px; }
      .eyebrow { color: #facc15; text-transform: uppercase; letter-spacing: 3px; font-size: 13px; margin-bottom: 10px; }
      h1 { font-size: 42px; line-height: 1.05; margin: 0 0 12px; }
      h2 { font-size: 24px; margin: 0 0 18px; }
      p { color: #d1d5db; font-size: 17px; margin: 0; }
      .grid-top { display: grid; grid-template-columns: 1fr 360px; gap: 24px; margin-bottom: 24px; }
      .grid-two { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
      .grid-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .grid-three { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
      .grid-four { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
      .panel { background: #111827; border: 1px solid #1f2937; padding: 26px; margin-bottom: 24px; }
      .panel.no-margin { margin-bottom: 0; }
      .field-label { color: #e5e7eb; font-size: 13px; font-weight: 700; margin-bottom: 5px; }
      .field-value { min-height: 36px; border: 1px solid #374151; background: #000; color: #fff; padding: 9px 10px; font-size: 15px; white-space: normal; overflow-wrap: break-word; }
      .field-wide { grid-column: 1 / -1; }
      .textarea { min-height: 88px; line-height: 1.35; }
      .customer-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; border: 1px solid #1f2937; background: #000; padding: 12px 14px; margin-bottom: 10px; font-size: 15px; font-weight: 700; }
      .box { width: 19px; height: 19px; border: 2px solid #e5e7eb; display: inline-flex; align-items: center; justify-content: center; color: #facc15; font-weight: 900; }
      .doc-row { display: flex; gap: 12px; align-items: flex-start; color: #d1d5db; margin-bottom: 14px; font-size: 15px; }
      .next-steps { border: 1px solid #1f2937; background: #000; padding: 16px; color: #d1d5db; font-size: 14px; }
      .next-steps strong { color: #fff; display: block; margin-bottom: 8px; }
      .next-steps ol { margin: 0; padding-left: 20px; }
      .actions-note { margin-top: 18px; color: #facc15; font-size: 13px; }
    </style>
    <div class="pdf-form">
      <div class="hero">
        <div class="eyebrow">Dealer Network</div>
        <h1>Dealer Application</h1>
        <p>Complete the online application below.</p>
      </div>

      <div class="grid-top">
        <div class="panel no-margin">
          <h2>Business details</h2>
          <div class="grid-fields">
            ${pdfField('Date', form.date)}
            ${pdfField('Country *', form.country)}
            ${pdfField('Company *', form.company)}
            ${pdfField('Contact *', form.contact)}
            ${pdfField('Email *', form.email)}
            ${pdfField('Phone', form.phone)}
            ${pdfField('Mobile', form.mobile)}
            ${pdfField('ABN or ACN', form.abnAcn)}
            ${pdfTextarea('Address', form.address)}
          </div>
        </div>
        <div class="panel no-margin">
          <h2>Customer type</h2>
          ${customerTypeOptions.map((type) => `<div class="customer-row"><span>${escapeHtml(type)}</span><span class="box">${form.customerTypes.includes(type) ? '✓' : ''}</span></div>`).join('')}
          <div style="height: 14px"></div>
          ${pdfField('R&R Account Manager', form.accountManager)}
          ${pdfField('Owner Name', form.ownerName)}
          ${pdfField('Owner Email', form.ownersEmail)}
          ${pdfField('Owner Mobile', form.ownersMobile)}
        </div>
      </div>

      <div class="panel">
        <h2>Business profile</h2>
        <div class="grid-three">
          ${pdfField('Number of owned workshops', form.ownedWorkshops)}
          ${pdfField('Trade customers, if wholesale', form.tradeCustomers)}
          ${pdfField('Warehouses and locations', form.warehouses)}
        </div>
      </div>

      <div class="grid-two">
        <div class="panel no-margin">
          <h2>Brands currently sold</h2>
          ${pdfField('Driving lamps', form.drivingLampBrands)}
          ${pdfField('Globes', form.globeBrands)}
          ${pdfField('Horns', form.hornBrands)}
        </div>
        <div class="panel no-margin">
          <h2>Notes and supported vehicles</h2>
          ${pdfTextarea('Any other notes', form.notes)}
          ${pdfTextarea('Main vehicles supported — manufacturer and model', form.vehiclesSupported)}
        </div>
      </div>

      <div class="panel">
        <h2>Current weekly volume and opportunity</h2>
        <div class="grid-four" style="margin-bottom: 14px;">
          ${pdfField('Driving lamps', form.drivingLampsVolume)}
          ${pdfField('Globe sets', form.globeSetsVolume)}
          ${pdfField('Horns', form.hornsVolume)}
          ${pdfField('Wipers', form.wipersVolume)}
        </div>
        ${pdfTextarea('Areas of interest / opportunity', form.areasOfInterest)}
      </div>

      <div class="panel">
        <h2>Documents and next steps</h2>
        <div class="doc-row"><span class="box">${form.businessRegistrationAttached ? '✓' : ''}</span><span>Current business registration is attached or available to provide.</span></div>
        <div class="doc-row"><span class="box">${form.consent ? '✓' : ''}</span><span>I confirm the information supplied is accurate and agree to be contacted by Race and Rally Australia about this application.</span></div>
        <div class="next-steps"><strong>After approval:</strong><ol><li>Race and Rally Australia approval confirmation and confidential dealer price list will be sent.</li><li>Point-of-sale and promotional material may be provided with the first order.</li></ol></div>
        <div class="actions-note">Generated from the online dealer application form.</div>
      </div>
    </div>
  `;
  return element;
};

const DealerApplicationPage: React.FC = () => {
  const [form, setForm] = React.useState<DealerApplicationForm>(initialForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [downloadingPdf, setDownloadingPdf] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const updateField = <K extends keyof DealerApplicationForm>(field: K, value: DealerApplicationForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleCustomerType = (type: string) => {
    setForm((current) => ({
      ...current,
      customerTypes: current.customerTypes.includes(type)
        ? current.customerTypes.filter((item) => item !== type)
        : [...current.customerTypes, type],
    }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      await contactService.submit({
        fullName: form.contact || form.ownerName,
        email: form.email || form.ownersEmail,
        phone: form.phone || form.mobile || form.ownersMobile,
        company: form.company,
        inquiryType: 'Dealer application',
        preferredContact: 'email',
        subject: `Dealer application - ${form.company || form.contact}`,
        message: buildApplicationMessage(form),
        vendorInterest: true,
      });
      setMessage('Thank you. Your dealer application has been submitted for review.');
      setForm(initialForm);
    } catch {
      setMessage('Unable to submit the application right now. Please try again shortly.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPdf = async () => {
    setDownloadingPdf(true);
    setMessage('Preparing PDF download...');
    const pdfElement = buildPdfElement(form);

    try {
      document.body.appendChild(pdfElement);
      await new Promise((resolve) => window.setTimeout(resolve, 100));
      const canvas = await html2canvas(pdfElement, {
        backgroundColor: '#000000',
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: pdfElement.scrollWidth,
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const pdfImageWidth = pageWidth - margin * 2;
      const pdfPageContentHeight = pageHeight - margin * 2;
      const canvasPageHeight = Math.floor((pdfPageContentHeight * canvas.width) / pdfImageWidth);
      let sourceY = 0;
      let pageIndex = 0;

      while (sourceY < canvas.height) {
        const sliceHeight = Math.min(canvasPageHeight, canvas.height - sourceY);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const context = pageCanvas.getContext('2d');
        if (!context) throw new Error('Unable to prepare PDF canvas.');
        context.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

        if (pageIndex > 0) pdf.addPage();
        const imageHeight = (sliceHeight * pdfImageWidth) / canvas.width;
        pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', margin, margin, pdfImageWidth, imageHeight);
        sourceY += sliceHeight;
        pageIndex += 1;
      }

      pdf.save(`${safeFileName(form.company || form.contact)}.pdf`);
      setMessage('PDF downloaded.');
    } catch {
      setMessage('Unable to generate the PDF. Please try again.');
    } finally {
      pdfElement.remove();
      setDownloadingPdf(false);
    }
  };

  const inputClass = 'w-full border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-motorsport-yellow';
  const labelClass = 'text-sm font-semibold text-gray-200';

  return (
    <div className="min-h-screen bg-black text-white">
      <section className="bg-gray-950 border-b border-gray-900">
        <div className="container-narrow px-4 md:px-6 py-14">
          <p className="text-motorsport-yellow text-sm uppercase tracking-[0.24em] mb-4">Dealer Network</p>
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">Dealer Application</h1>
          <p className="max-w-3xl text-gray-300 text-lg">
            Complete the online application below.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-narrow px-4 md:px-6">
          <form onSubmit={submit} className="space-y-8 bg-black">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
              <div className="bg-gray-900 border border-gray-800 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="text-motorsport-yellow" />
                  <h2 className="text-2xl font-heading font-bold">Business details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={labelClass}>Date<input className={inputClass} type="date" value={form.date} onChange={(e) => updateField('date', e.target.value)} /></label>
                  <label className={labelClass}>Country *<input className={inputClass} value={form.country} onChange={(e) => updateField('country', e.target.value)} required /></label>
                  <label className={labelClass}>Company *<input className={inputClass} value={form.company} onChange={(e) => updateField('company', e.target.value)} required /></label>
                  <label className={labelClass}>Contact *<input className={inputClass} value={form.contact} onChange={(e) => updateField('contact', e.target.value)} required /></label>
                  <label className={labelClass}>Email *<input className={inputClass} type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} required /></label>
                  <label className={labelClass}>Phone<input className={inputClass} value={form.phone} onChange={(e) => updateField('phone', e.target.value)} /></label>
                  <label className={labelClass}>Mobile<input className={inputClass} value={form.mobile} onChange={(e) => updateField('mobile', e.target.value)} /></label>
                  <label className={labelClass}>ABN or ACN<input className={inputClass} value={form.abnAcn} onChange={(e) => updateField('abnAcn', e.target.value)} /></label>
                  <label className={`${labelClass} md:col-span-2`}>Address<textarea className={`${inputClass} min-h-[90px]`} value={form.address} onChange={(e) => updateField('address', e.target.value)} /></label>
                </div>
              </div>

              <aside className="bg-gray-900 border border-gray-800 p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-heading font-bold mb-4">Customer type</h2>
                  <div className="space-y-3">
                    {customerTypeOptions.map((type) => (
                      <label key={type} className="flex items-center justify-between gap-4 border border-gray-800 bg-black px-4 py-3 text-sm font-semibold">
                        {type}
                        <input type="checkbox" checked={form.customerTypes.includes(type)} onChange={() => toggleCustomerType(type)} className="h-5 w-5 accent-motorsport-yellow" />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className={labelClass}>R&R Account Manager<input className={inputClass} value={form.accountManager} onChange={(e) => updateField('accountManager', e.target.value)} /></label>
                  <label className={labelClass}>Owner Name<input className={inputClass} value={form.ownerName} onChange={(e) => updateField('ownerName', e.target.value)} /></label>
                  <label className={labelClass}>Owner Email<input className={inputClass} type="email" value={form.ownersEmail} onChange={(e) => updateField('ownersEmail', e.target.value)} /></label>
                  <label className={labelClass}>Owner Mobile<input className={inputClass} value={form.ownersMobile} onChange={(e) => updateField('ownersMobile', e.target.value)} /></label>
                </div>
              </aside>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 md:p-8">
              <h2 className="text-2xl font-heading font-bold mb-6">Business profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className={labelClass}>Number of owned workshops<input className={inputClass} value={form.ownedWorkshops} onChange={(e) => updateField('ownedWorkshops', e.target.value)} /></label>
                <label className={labelClass}>Trade customers, if wholesale<input className={inputClass} value={form.tradeCustomers} onChange={(e) => updateField('tradeCustomers', e.target.value)} /></label>
                <label className={labelClass}>Warehouses and locations<input className={inputClass} value={form.warehouses} onChange={(e) => updateField('warehouses', e.target.value)} /></label>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 p-6 md:p-8">
                <h2 className="text-2xl font-heading font-bold mb-6">Brands currently sold</h2>
                <div className="space-y-4">
                  <label className={labelClass}>Driving lamps<input className={inputClass} value={form.drivingLampBrands} onChange={(e) => updateField('drivingLampBrands', e.target.value)} /></label>
                  <label className={labelClass}>Globes<input className={inputClass} value={form.globeBrands} onChange={(e) => updateField('globeBrands', e.target.value)} /></label>
                  <label className={labelClass}>Horns<input className={inputClass} value={form.hornBrands} onChange={(e) => updateField('hornBrands', e.target.value)} /></label>
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 p-6 md:p-8">
                <h2 className="text-2xl font-heading font-bold mb-6">Notes and supported vehicles</h2>
                <label className={labelClass}>Any other notes<textarea className={`${inputClass} min-h-[92px] mb-4`} value={form.notes} onChange={(e) => updateField('notes', e.target.value)} /></label>
                <label className={labelClass}>Main vehicles supported — manufacturer and model<textarea className={`${inputClass} min-h-[92px]`} value={form.vehiclesSupported} onChange={(e) => updateField('vehiclesSupported', e.target.value)} /></label>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 md:p-8">
              <h2 className="text-2xl font-heading font-bold mb-6">Current weekly volume and opportunity</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <label className={labelClass}>Driving lamps<input className={inputClass} value={form.drivingLampsVolume} onChange={(e) => updateField('drivingLampsVolume', e.target.value)} /></label>
                <label className={labelClass}>Globe sets<input className={inputClass} value={form.globeSetsVolume} onChange={(e) => updateField('globeSetsVolume', e.target.value)} /></label>
                <label className={labelClass}>Horns<input className={inputClass} value={form.hornsVolume} onChange={(e) => updateField('hornsVolume', e.target.value)} /></label>
                <label className={labelClass}>Wipers<input className={inputClass} value={form.wipersVolume} onChange={(e) => updateField('wipersVolume', e.target.value)} /></label>
              </div>
              <label className={labelClass}>Areas of interest / opportunity<textarea className={`${inputClass} min-h-[100px]`} value={form.areasOfInterest} onChange={(e) => updateField('areasOfInterest', e.target.value)} /></label>
            </div>

            <div className="bg-gray-950 border border-gray-800 p-6 md:p-8">
              <h2 className="text-2xl font-heading font-bold mb-4">Documents and next steps</h2>
              <label className="flex items-start gap-3 text-gray-300 mb-4">
                <input type="checkbox" checked={form.businessRegistrationAttached} onChange={(e) => updateField('businessRegistrationAttached', e.target.checked)} className="mt-1 h-5 w-5 accent-motorsport-yellow" />
                <span>Current business registration is attached or available to provide.</span>
              </label>
              <label className="flex items-start gap-3 text-gray-300 mb-6">
                <input type="checkbox" checked={form.consent} onChange={(e) => updateField('consent', e.target.checked)} className="mt-1 h-5 w-5 accent-motorsport-yellow" required />
                <span>I confirm the information supplied is accurate and agree to be contacted by Race and Rally Australia about this application. *</span>
              </label>
              <div className="border border-gray-800 bg-black p-4 text-sm text-gray-300 mb-6">
                <p className="font-semibold text-white mb-2">After approval:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Race and Rally Australia approval confirmation and confidential dealer price list will be sent.</li>
                  <li>Point-of-sale and promotional material may be provided with the first order.</li>
                </ol>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <button type="submit" disabled={submitting} className="btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3 disabled:opacity-60">
                  {submitting ? 'Submitting...' : 'Submit application'} <Send size={18} />
                </button>
                <button type="button" onClick={() => void downloadPdf()} disabled={downloadingPdf} className="btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3 disabled:opacity-60">
                  {downloadingPdf ? 'Preparing PDF...' : 'Download PDF'} <Download size={18} />
                </button>
                {message ? <p className="inline-flex items-center gap-2 text-sm text-motorsport-yellow"><CheckCircle2 size={18} />{message}</p> : null}
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default DealerApplicationPage;