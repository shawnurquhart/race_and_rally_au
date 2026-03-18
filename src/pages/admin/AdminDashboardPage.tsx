import React from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';

const AdminDashboardPage: React.FC = () => {
  const cards = [
    {
      title: 'Product Upload',
      description: 'Import CSV product files, map fields, assign categories, and attach image files.',
      to: '/admin/upload',
      action: 'Open Upload',
    },
    {
      title: 'Product Review',
      description: 'Review stored products, verify image matches, and remove incorrect entries.',
      to: '/admin/review',
      action: 'Open Review',
    },
    {
      title: 'Settings',
      description: 'Manage uploading file/photo rules and storefront product display sizing defaults.',
      to: '/admin/settings',
      action: 'Open Settings',
    },
  ];

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
