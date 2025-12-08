import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Gear', href: '/gear' },
    { label: 'Brands', href: '/brands' },
    { label: 'Events', href: '/events' },
    { label: 'News', href: '/news' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Contact', href: '/contact' },
    { label: 'Shop', href: '/shop', isPlaceholder: true },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-900">
      <div className="container-narrow px-4 md:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="text-2xl md:text-3xl font-heading font-bold tracking-tight">
              Race & Rally <span className="text-motorsport-yellow">Australia</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`font-medium transition-colors hover:text-motorsport-yellow ${
                  item.isPlaceholder ? 'text-gray-500' : 'text-white'
                }`}
              >
                {item.label}
                {item.isPlaceholder && (
                  <span className="ml-1 text-xs text-motorsport-yellow">(Soon)</span>
                )}
              </a>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-900 py-4">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`font-medium py-2 px-4 transition-colors hover:text-motorsport-yellow ${
                    item.isPlaceholder ? 'text-gray-500' : 'text-white'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                  {item.isPlaceholder && (
                    <span className="ml-2 text-xs text-motorsport-yellow">(Coming Soon)</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
