import React from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';

const AdminDashboardPage: React.FC = () => {
  const cards = [
    {
      title: 'Sales',
      description: 'Track fulfilment queue and simulated banking transactions for completed purchases.',
      to: '/admin/sales',
      action: 'Open Sales section',
    },
    {
      title: 'Payment Testing',
      description: 'Create hosted Till payment test sessions, inspect gateway responses, and review callback/logging data.',
      to: '/admin/payment-testing',
      action: 'Open Payment Testing',
    },
    {
      title: 'Traffic Reporting',
      description: 'Monitor visits by timestamp, page, IP, and estimated view duration. Export and reset logs.',
      to: '/admin/traffic-reporting',
      action: 'Open Traffic Reporting',
    },
    {
      title: 'Site Reporting',
      description: 'Audit site pages for remaining default/WIP content and track sections that still need updates.',
      to: '/admin/site-reporting',
      action: 'Open Site Reporting',
    },
    {
      title: 'Page Status & Availability',
      description: 'Set each page/form as up to date or needs update, mark online/offline, and save operational notes.',
      to: '/admin/page-status-availability',
      action: 'Open Page Status & Availability',
    },
    {
      title: 'Contact Submissions',
      description: 'View, copy, and delete contact form submissions including newsletter and vendor-interest requests.',
      to: '/admin/contact-submissions',
      action: 'Open Contact Submissions',
    },
    {
      title: 'PIAA Products Display & Maintenance',
      description: 'Open PIAA admin tools for spreadsheet upload, product upload, product review, and settings.',
      to: '/admin/piaa-maintenance',
      action: 'Open PIAA section',
    },
    {
      title: 'Settings',
      description: 'Configure system settings including contact form destination email and site/admin options.',
      to: '/admin/settings',
      action: 'Open Settings',
    },
    {
      title: 'Next product section will be here',
      description: 'Reserved for the next brand/product family maintenance module.',
      to: '/admin',
      action: 'Coming soon',
    },
  ];

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <div key={card.title} className="border border-gray-800 bg-gray-900 p-5">
            <h2 className="text-xl font-heading font-bold mb-3">{card.title}</h2>
            <p className="text-gray-400 text-sm mb-5 min-h-20">{card.description}</p>

            <Link to={card.to} className="btn-primary inline-block text-sm">
              {card.action}
            </Link>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
