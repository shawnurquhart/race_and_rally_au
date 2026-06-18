import React from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { contactService } from '@/services/contactService';

const ContactPage: React.FC = () => {
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [inquiryType, setInquiryType] = React.useState('General enquiry');
  const [vehicleDetails, setVehicleDetails] = React.useState('');
  const [preferredContact, setPreferredContact] = React.useState('email');
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [newsletterOptIn, setNewsletterOptIn] = React.useState(false);
  const [vendorInterest, setVendorInterest] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formMessage, setFormMessage] = React.useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMessage('');
    try {
      await contactService.submit({
        fullName,
        email,
        phone,
        company,
        inquiryType,
        vehicleDetails,
        preferredContact,
        subject,
        message,
        newsletterOptIn,
        vendorInterest,
      });
      setFormMessage('Your message has been sent. We will contact you shortly.');
      setFullName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setInquiryType('General enquiry');
      setVehicleDetails('');
      setPreferredContact('email');
      setSubject('');
      setMessage('');
      setNewsletterOptIn(false);
      setVendorInterest(false);
    } catch {
      setFormMessage('Unable to submit right now. Please try again shortly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative bg-gray-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="relative z-10 container-narrow px-4 md:px-6 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-6">
              Contact <span className="text-motorsport-yellow">Race and Rally Australia</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              Professional support for motorsport professionals. Get in touch with our technical team.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="section-padding bg-black">
        <div className="container-narrow px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: MapPin,
                title: 'Location',
                details: ['Online Sales via Canberra based Warehousing'],
                description: 'Online sales and fulfilment support'
              },
              {
                icon: Phone,
                title: 'Phone',
                details: ['+61 1300 123 456', 'Technical Support: 9AM-5PM AEST'],
                description: 'Mon-Fri, excluding public holidays'
              },
              {
                icon: Mail,
                title: 'Email',
                details: [
                  'Manager: manager@raceandrallyaustralia.com.au',
                  'Sales: sales@raceandrallyaustralia.com.au',
                ],
                description: 'Response within 24 hours'
              }
            ].map((contact) => (
              <div key={contact.title} className="bg-gray-900 border border-gray-800 p-8 text-center">
                <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <contact.icon className="text-motorsport-yellow" size={28} />
                </div>
                <h3 className="text-2xl font-heading font-bold mb-4">{contact.title}</h3>
                <div className="space-y-2 mb-4">
                  {contact.details.map((detail, index) => (
                    <p key={index} className="text-gray-300">{detail}</p>
                  ))}
                </div>
                <p className="text-gray-400 text-sm">{contact.description}</p>
              </div>
            ))}
          </div>

          {/* Business Hours */}
          <div className="bg-gray-900 border border-gray-800 p-8 mb-16">
            <div className="flex items-center justify-center mb-6">
              <Clock className="text-motorsport-yellow mr-3" size={24} />
              <h3 className="text-2xl font-heading font-bold">Business Hours</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-heading font-bold text-lg mb-4 text-motorsport-yellow">Technical Support</h4>
                <div className="space-y-2">
                  {['Monday - Friday: 9:00 AM - 5:00 PM AEST', 'Saturday: 10:00 AM - 2:00 PM AEST', 'Sunday: Closed', 'Public Holidays: Closed'].map((time) => (
                    <p key={time} className="text-gray-300">{time}</p>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-heading font-bold text-lg mb-4 text-motorsport-yellow">Showroom Appointments</h4>
                <div className="space-y-2">
                  {['By appointment only', 'Monday - Friday: 10:00 AM - 4:00 PM', 'Weekend appointments available', 'Professional consultations'].map((time) => (
                    <p key={time} className="text-gray-300">{time}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-8">
            <h3 className="text-2xl font-heading font-bold mb-6">Contact Form</h3>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={submit}>
              <input className="bg-black border border-gray-700 px-3 py-2" placeholder="Full name *" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <input className="bg-black border border-gray-700 px-3 py-2" placeholder="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input className="bg-black border border-gray-700 px-3 py-2" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input className="bg-black border border-gray-700 px-3 py-2" placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
              <select className="bg-black border border-gray-700 px-3 py-2" value={inquiryType} onChange={(e) => setInquiryType(e.target.value)}>
                <option>General enquiry</option>
                <option>Technical support</option>
                <option>Product advice</option>
                <option>Warranty request</option>
                <option>Dealer enquiry</option>
              </select>
              <input className="bg-black border border-gray-700 px-3 py-2" placeholder="Vehicle details (make/model/year)" value={vehicleDetails} onChange={(e) => setVehicleDetails(e.target.value)} />
              <select className="bg-black border border-gray-700 px-3 py-2" value={preferredContact} onChange={(e) => setPreferredContact(e.target.value)}>
                <option value="email">Preferred contact: Email</option>
                <option value="phone">Preferred contact: Phone</option>
              </select>
              <input className="bg-black border border-gray-700 px-3 py-2" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              <textarea className="md:col-span-2 bg-black border border-gray-700 px-3 py-2 min-h-[140px]" placeholder="Your message *" value={message} onChange={(e) => setMessage(e.target.value)} required />
              <label className="md:col-span-2 inline-flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={newsletterOptIn} onChange={(e) => setNewsletterOptIn(e.target.checked)} /> Register for Newsletter
              </label>
              <label className="md:col-span-2 inline-flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={vendorInterest} onChange={(e) => setVendorInterest(e.target.checked)} /> Register interest to sell a product/service on this site
              </label>
              <div className="md:col-span-2 flex items-center gap-4">
                <button className="btn-secondary px-5 py-2" type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Submit'}</button>
                {formMessage ? <p className="text-sm text-motorsport-yellow">{formMessage}</p> : null}
              </div>
            </form>
          </div>

          {/* Emergency Contact */}
          <div className="mt-16 bg-gray-950 border border-gray-800 p-8 text-center">
            <h3 className="text-2xl font-heading font-bold mb-4 text-motorsport-yellow">
              Technical Emergency Support
            </h3>
            <p className="text-gray-300 mb-6">
              For urgent technical support during motorsport events, contact our emergency support line.
            </p>
            <div className="inline-flex items-center bg-black border border-gray-700 px-6 py-3">
              <Phone className="text-motorsport-yellow mr-3" size={20} />
              <span className="text-xl font-bold">+61 1300 555 123</span>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              24/7 during scheduled motorsport events only
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
