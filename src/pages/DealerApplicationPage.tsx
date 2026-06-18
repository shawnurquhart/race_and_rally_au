import React from 'react';
import { CheckCircle2, FileText, Send } from 'lucide-react';
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

const DealerApplicationPage: React.FC = () => {
  const [form, setForm] = React.useState<DealerApplicationForm>(initialForm);
  const [submitting, setSubmitting] = React.useState(false);
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
          <form onSubmit={submit} className="space-y-8">
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