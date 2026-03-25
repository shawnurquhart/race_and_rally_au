import React, { useState } from 'react';
import { Menu, ShoppingCart, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '@/auth/AdminAuthContext';
import { CART_UPDATED_EVENT, cartService } from '@/services/cartService';
import { ADMIN_SETTINGS_UPDATED_EVENT, adminSettingsService } from '@/services/adminSettingsService';

interface NavItem {
  label: string;
  href: string;
  isPlaceholder?: boolean;
}

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(() => cartService.getItemCount());
  const [menuSettings, setMenuSettings] = useState(() => adminSettingsService.get());
  const { isAuthenticated, logout } = useAdminAuth();

  React.useEffect(() => {
    const syncCartCount = () => setCartItemCount(cartService.getItemCount());
    const syncMenuSettings = () => setMenuSettings(adminSettingsService.get());
    syncCartCount();
    syncMenuSettings();

    window.addEventListener(CART_UPDATED_EVENT, syncCartCount);
    window.addEventListener(ADMIN_SETTINGS_UPDATED_EVENT, syncMenuSettings);
    window.addEventListener('storage', syncCartCount);
    window.addEventListener('storage', syncMenuSettings);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCartCount);
      window.removeEventListener(ADMIN_SETTINGS_UPDATED_EVENT, syncMenuSettings);
      window.removeEventListener('storage', syncCartCount);
      window.removeEventListener('storage', syncMenuSettings);
    };
  }, []);

  const navItems: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    ...(menuSettings.showGearOnMenu ? [{ label: 'Gear', href: '/gear' }] : []),
    ...(menuSettings.showBrandsOnMenu ? [{ label: 'Brands', href: '/brands' }] : []),
    { label: 'PIAA', href: '/brands/piaa' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Events', href: '/events' },
    { label: 'News', href: '/news' },
    { label: 'Dealers', href: '/dealers' },
    { label: 'Contact', href: '/contact' },
    { label: 'Shop', href: '/shop' },
    { label: `Cart (${cartItemCount})`, href: '/cart' },
  ];

  const authenticatedItems: NavItem[] = isAuthenticated ? [{ label: 'Admin', href: '/admin' }] : [];
  const allItems = [...navItems, ...authenticatedItems];

  return (
    <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-900">
      <div className="container-narrow px-4 md:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl md:text-3xl font-heading font-bold tracking-tight">
              Race & Rally <span className="text-motorsport-yellow">Australia</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {allItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`font-medium transition-colors hover:text-motorsport-yellow ${
                  item.isPlaceholder ? 'text-gray-500' : 'text-white'
                }`}
              >
                {item.label}
                {item.href === '/cart' && <ShoppingCart size={14} className="inline ml-1" />}
              </Link>
            ))}
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="font-medium text-gray-300 transition-colors hover:text-motorsport-yellow"
              >
                Logout
              </button>
            ) : (
              <Link to="/admin/login" className="font-medium text-gray-500 transition-colors hover:text-motorsport-yellow">
                Admin Login
              </Link>
            )}
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
              {allItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`font-medium py-2 px-4 transition-colors hover:text-motorsport-yellow ${
                    item.isPlaceholder ? 'text-gray-500' : 'text-white'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                  {item.href === '/cart' && <ShoppingCart size={14} className="inline ml-2" />}
                </Link>
              ))}
              {isAuthenticated ? (
                <button
                  className="text-left font-medium py-2 px-4 text-gray-300 transition-colors hover:text-motorsport-yellow"
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/admin/login"
                  className="font-medium py-2 px-4 text-gray-500 transition-colors hover:text-motorsport-yellow"
                  onClick={() => setIsOpen(false)}
                >
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
