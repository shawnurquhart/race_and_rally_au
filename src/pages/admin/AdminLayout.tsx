import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAdminAuth } from '@/auth/AdminAuthContext';

interface AdminLayoutProps {
  title: string;
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ title, children }) => {
  const location = useLocation();
  const { logout } = useAdminAuth();

  const links = [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Product Upload', to: '/admin/upload' },
    { label: 'Product Review', to: '/admin/review' },
    { label: 'Settings', to: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-black">
      <section className="section-padding">
        <div className="container-narrow px-4 md:px-6">
          <div className="flex flex-col gap-6 mb-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-motorsport-yellow text-sm uppercase tracking-wide">Admin</p>
              <h1 className="text-3xl md:text-4xl font-heading font-bold">{title}</h1>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center justify-center border border-gray-700 px-4 py-2 hover:border-motorsport-yellow hover:text-motorsport-yellow transition-colors"
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </button>
          </div>

          <div className="border border-gray-800 bg-gray-950 p-3 mb-6 flex flex-wrap gap-2">
            {links.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 text-sm border transition-colors ${
                    active
                      ? 'border-motorsport-yellow text-motorsport-yellow bg-motorsport-yellow/10'
                      : 'border-gray-800 text-gray-300 hover:border-gray-600 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {children}
        </div>
      </section>
    </div>
  );
};

export default AdminLayout;
