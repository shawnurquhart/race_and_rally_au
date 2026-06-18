import React, { useState } from 'react';
import { Menu, ShoppingCart, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '@/auth/AdminAuthContext';
import { CART_UPDATED_EVENT, cartService } from '@/services/cartService';
import { ADMIN_SETTINGS_UPDATED_EVENT, adminSettingsService } from '@/services/adminSettingsService';
import { PAGE_STATUS_UPDATED_EVENT, pageStatusService } from '@/services/pageStatusService';
import { getDefaultOnlineByRoute } from '@/config/pageStatusRegistry';
import type { SiteMode } from '@/services/siteModeService';

interface NavItem {
  label: string;
  href: string;
  isPlaceholder?: boolean;
}

const Navigation: React.FC<{ siteMode?: SiteMode }> = ({ siteMode = 'standard' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(() => cartService.getItemCount());
  const [menuSettings, setMenuSettings] = useState(() => adminSettingsService.get());
  const [onlineByRoute, setOnlineByRoute] = useState<Map<string, boolean>>(() => getDefaultOnlineByRoute());
  const { isAuthenticated, logout } = useAdminAuth();

  React.useEffect(() => {
    const syncCartCount = () => setCartItemCount(cartService.getItemCount());
    const syncMenuSettings = () => setMenuSettings(adminSettingsService.get());
    const syncPageAvailability = async () => {
      try {
        const rows = await pageStatusService.list();
        const next = getDefaultOnlineByRoute();
        rows.forEach((row) => {
          if (row.kind === 'page' && row.routePath) {
            next.set(row.routePath, row.isOnline);
          }
        });
        setOnlineByRoute(next);
      } catch {
        // ignore and keep defaults
      }
    };
    syncCartCount();
    syncMenuSettings();
    void syncPageAvailability();

    window.addEventListener(CART_UPDATED_EVENT, syncCartCount);
    window.addEventListener(ADMIN_SETTINGS_UPDATED_EVENT, syncMenuSettings);
    window.addEventListener('storage', syncCartCount);
    window.addEventListener('storage', syncMenuSettings);
    window.addEventListener(PAGE_STATUS_UPDATED_EVENT, syncPageAvailability);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCartCount);
      window.removeEventListener(ADMIN_SETTINGS_UPDATED_EVENT, syncMenuSettings);
      window.removeEventListener('storage', syncCartCount);
      window.removeEventListener('storage', syncMenuSettings);
      window.removeEventListener(PAGE_STATUS_UPDATED_EVENT, syncPageAvailability);
    };
  }, []);

  const isOnline = (routePath: string): boolean => onlineByRoute.get(routePath) !== false;

  const navItems: NavItem[] = [
    { label: 'Home', href: '/' },
    ...(isOnline('/about') ? [{ label: 'About', href: '/about' }] : []),
    ...(menuSettings.showGearOnMenu && isOnline('/gear') ? [{ label: 'Gear', href: '/gear' }] : []),
    ...(menuSettings.showBrandsOnMenu && isOnline('/brands') ? [{ label: 'Brands', href: '/brands' }] : []),
    ...(isOnline('/brands/piaa') ? [{ label: 'PIAA', href: '/brands/piaa' }] : []),
    ...(isOnline('/gallery') ? [{ label: 'Gallery', href: '/gallery' }] : []),
    ...(isOnline('/events') ? [{ label: 'Events', href: '/events' }] : []),
    ...(isOnline('/news') ? [{ label: 'News', href: '/news' }] : []),
    ...(isOnline('/dealers') ? [{ label: 'Dealers', href: '/dealers' }] : []),
    ...(isOnline('/contact') ? [{ label: 'Contact', href: '/contact' }] : []),
    ...(isOnline('/shop') ? [{ label: 'Shop', href: '/shop' }] : []),
    ...(isOnline('/cart') ? [{ label: `Cart (${cartItemCount})`, href: '/cart' }] : []),
  ];

  const allItems = [...navItems];

  return (
    <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-900">
      <div className="container-narrow px-4 md:px-6">
        <div className="py-4 md:py-5">
          {/* Site Heading */}
          <div className="flex justify-start mb-3 md:mb-4">
            <Link to="/" className="text-3xl md:text-5xl font-heading font-bold tracking-tight text-left leading-tight">
              Race and Rally <span className="text-motorsport-yellow">Australia</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-start gap-6 lg:gap-8 flex-wrap">
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
            {siteMode !== 'hide_admin' && isAuthenticated ? (
              <div className="inline-flex items-center gap-4 whitespace-nowrap">
                <Link to="/admin" className="font-medium text-white transition-colors hover:text-motorsport-yellow">
                  Admin
                </Link>
                <button
                  onClick={logout}
                  className="font-medium text-gray-300 transition-colors hover:text-motorsport-yellow"
                >
                  Logout
                </button>
              </div>
            ) : siteMode !== 'hide_admin' ? (
              <Link to="/admin/login" className="font-medium text-gray-500 transition-colors hover:text-motorsport-yellow">
                Admin Login
              </Link>
            ) : null}
          </div>

          {siteMode === 'update_mode' ? (
            <div className="mt-3 border border-yellow-600/60 bg-yellow-400/10 px-3 py-2 text-sm text-yellow-100">
              Site is currently in update mode. Some features may be temporarily unavailable.
            </div>
          ) : null}

          {/* Mobile menu button */}
          <div className="md:hidden flex justify-end">
            <button
              className="text-white p-2"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="md:hidden border-t border-gray-900 py-4 mt-2">
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
                {siteMode !== 'hide_admin' && isAuthenticated ? (
                  <button
                    className="text-left font-medium py-2 px-4 text-gray-300 transition-colors hover:text-motorsport-yellow"
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                  >
                    Logout
                  </button>
                ) : siteMode !== 'hide_admin' ? (
                  <Link
                    to="/admin/login"
                    className="font-medium py-2 px-4 text-gray-500 transition-colors hover:text-motorsport-yellow"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin Login
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
