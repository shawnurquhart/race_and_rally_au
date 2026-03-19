import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface PIAANavItem {
  label: string;
  to: string;
}

const NAV_ITEMS: PIAANavItem[] = [
  { label: 'Hub', to: '/brands/piaa' },
  { label: 'Shop Catalogue', to: '/brands/piaa/catalog' },
  { label: 'Find Your Light', to: '/brands/piaa/find-your-light' },
  { label: 'Technical', to: '/brands/piaa/technical' },
  { label: 'Applications', to: '/brands/piaa/applications' },
  { label: 'Spotlight', to: '/brands/piaa/spotlight' },
  { label: 'Digital Catalogue', to: '/brands/piaa/digital-catalogue' },
];

const PIAASubNav: React.FC = () => {
  const location = useLocation();

  return (
    <div className="mb-8 border border-gray-800 bg-gray-950 p-3 md:p-4">
      <div className="flex flex-wrap gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== '/brands/piaa' && location.pathname.startsWith(`${item.to}/`));

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`px-3 py-2 text-xs md:text-sm border transition-colors ${
                isActive
                  ? 'border-motorsport-yellow bg-motorsport-yellow/10 text-motorsport-yellow'
                  : 'border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default PIAASubNav;
