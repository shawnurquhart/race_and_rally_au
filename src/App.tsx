import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './auth/AdminAuthContext';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import TrafficTracker from './components/TrafficTracker';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import PIAAPage from './pages/PIAAPage';
import PIAACatalogPage from './pages/PIAACatalogPage';
import AboutPage from './pages/AboutPage';
import BrandsPage from './pages/BrandsPage';
import ContactPage from './pages/ContactPage';
import DealersPage from './pages/DealersPage';
import DealerApplicationPage from './pages/DealerApplicationPage';
import EventsPage from './pages/EventsPage';
import GalleryPage from './pages/GalleryPage';
import GearPage from './pages/GearPage';
import NewsPage from './pages/NewsPage';
import TermsPage from './pages/TermsPage';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductUploadPage from './pages/admin/AdminProductUploadPage';
import AdminSpreadsheetUploadPage from './pages/admin/AdminSpreadsheetUploadPage';
import AdminProductReviewPage from './pages/admin/AdminProductReviewPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminPiaaMaintenancePage from './pages/admin/AdminPiaaMaintenancePage';
import AdminSalesPage from './pages/admin/AdminSalesPage';
import AdminTrafficReportingPage from './pages/admin/AdminTrafficReportingPage';
import AdminContactSubmissionsPage from './pages/admin/AdminContactSubmissionsPage';
import AdminSiteReportingPage from './pages/admin/AdminSiteReportingPage';
import AdminPageStatusAvailabilityPage from './pages/admin/AdminPageStatusAvailabilityPage';
import AdminPaymentTestingPage from './pages/admin/AdminPaymentTestingPage';
import PIAAProductPage from './pages/PIAAProductPage';
import PIAAFindYourLightPage from './pages/PIAAFindYourLightPage';
import PIAATechnicalPage from './pages/PIAATechnicalPage';
import PIAAApplicationsPage from './pages/PIAAApplicationsPage';
import PIAASpotlightPage from './pages/PIAASpotlightPage';
import PIAADigitalCataloguePage from './pages/PIAADigitalCataloguePage';
import { pageStatusService } from './services/pageStatusService';
import { getDefaultOnlineByRoute } from './config/pageStatusRegistry';
import React from 'react';
import { siteModeService, type SiteMode, SITE_MODE_UPDATED_EVENT } from './services/siteModeService';

const SiteUpdateModePage: React.FC = () => (
  <div className="container-narrow px-4 md:px-6 py-14">
    <div className="border border-yellow-600/60 bg-yellow-400/10 p-6 md:p-8">
      <h1 className="text-3xl md:text-4xl font-heading font-bold mb-3">Site in Update Mode</h1>
      <p className="text-gray-200">
        We’re currently performing updates. Please check back shortly.
      </p>
    </div>
  </div>
);

function App() {
  const [onlineByRoute, setOnlineByRoute] = React.useState<Map<string, boolean>>(() => getDefaultOnlineByRoute());
  const [siteMode, setSiteMode] = React.useState<SiteMode>('standard');

  React.useEffect(() => {
    const load = async () => {
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
        // Keep default route availability if API is unavailable.
      }
    };

    void load();
  }, []);

  React.useEffect(() => {
    const load = async () => {
      try {
        const mode = await siteModeService.getMode();
        setSiteMode(mode);
      } catch {
        setSiteMode('standard');
      }
    };

    const onUpdated = (event: Event) => {
      const detail = (event as CustomEvent<SiteMode>).detail;
      if (detail === 'standard' || detail === 'hide_admin' || detail === 'update_mode') {
        setSiteMode(detail);
      }
    };

    void load();
    window.addEventListener(SITE_MODE_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(SITE_MODE_UPDATED_EVENT, onUpdated);
  }, []);

  const isOnline = (routePath: string): boolean => onlineByRoute.get(routePath) !== false;

  return (
    <AdminAuthProvider>
      <Router>
        <TrafficTracker />
        <div className="min-h-screen flex flex-col">
          <Navigation siteMode={siteMode} />
          <main className="flex-grow">
            <Routes>
              {siteMode === 'update_mode' ? (
                <Route path="*" element={<SiteUpdateModePage />} />
              ) : (
                <>
              <Route path="/" element={<HomePage />} />
              {isOnline('/about') ? <Route path="/about" element={<AboutPage />} /> : null}
              {isOnline('/gear') ? <Route path="/gear" element={<GearPage />} /> : null}
              {isOnline('/brands') ? <Route path="/brands" element={<BrandsPage />} /> : null}
              {isOnline('/brands/piaa') ? <Route path="/brands/piaa" element={<PIAAPage />} /> : null}
              {isOnline('/brands/piaa') ? <Route path="/brands/piaa/catalog" element={<PIAACatalogPage />} /> : null}
              {isOnline('/brands/piaa') ? <Route path="/brands/piaa/find-your-light" element={<PIAAFindYourLightPage />} /> : null}
              {isOnline('/brands/piaa') ? <Route path="/brands/piaa/technical" element={<PIAATechnicalPage />} /> : null}
              {isOnline('/brands/piaa') ? <Route path="/brands/piaa/applications" element={<PIAAApplicationsPage />} /> : null}
              {isOnline('/brands/piaa') ? <Route path="/brands/piaa/spotlight" element={<PIAASpotlightPage />} /> : null}
              {isOnline('/brands/piaa') ? <Route path="/brands/piaa/digital-catalogue" element={<PIAADigitalCataloguePage />} /> : null}
              {isOnline('/brands/piaa') ? <Route path="/brands/piaa/product/:productId" element={<PIAAProductPage />} /> : null}
              {isOnline('/brands/piaa') ? <Route path="/brands/piaa/catalog/product/:productId" element={<PIAAProductPage />} /> : null}
              {isOnline('/events') ? <Route path="/events" element={<EventsPage />} /> : null}
              {isOnline('/news') ? <Route path="/news" element={<NewsPage />} /> : null}
              {isOnline('/terms') ? <Route path="/terms" element={<TermsPage />} /> : null}
              {isOnline('/gallery') ? <Route path="/gallery" element={<GalleryPage />} /> : null}
              {isOnline('/dealers') ? <Route path="/dealers" element={<DealersPage />} /> : null}
              {isOnline('/dealer-application') ? <Route path="/dealer-application" element={<DealerApplicationPage />} /> : null}
              {isOnline('/contact') ? <Route path="/contact" element={<ContactPage />} /> : null}
              {isOnline('/shop') ? <Route path="/shop" element={<ShopPage />} /> : null}
              {isOnline('/cart') ? <Route path="/cart" element={<CartPage />} /> : null}
              {isOnline('/checkout') ? <Route path="/checkout" element={<CheckoutPage />} /> : null}
              {siteMode === 'standard' ? (
                <>
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedAdminRoute>
                        <AdminDashboardPage />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/sales"
                    element={
                      <ProtectedAdminRoute>
                        <AdminSalesPage />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/traffic-reporting"
                    element={
                      <ProtectedAdminRoute>
                        <AdminTrafficReportingPage />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/site-reporting"
                    element={
                      <ProtectedAdminRoute>
                        <AdminSiteReportingPage />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/contact-submissions"
                    element={
                      <ProtectedAdminRoute>
                        <AdminContactSubmissionsPage />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/payment-testing"
                    element={
                      <ProtectedAdminRoute>
                        <AdminPaymentTestingPage />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/page-status-availability"
                    element={
                      <ProtectedAdminRoute>
                        <AdminPageStatusAvailabilityPage />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/piaa-maintenance"
                    element={
                      <ProtectedAdminRoute>
                        <AdminPiaaMaintenancePage />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/spreadsheet-upload"
                    element={
                      <ProtectedAdminRoute>
                        <AdminSpreadsheetUploadPage />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/upload"
                    element={
                      <ProtectedAdminRoute>
                        <AdminProductUploadPage />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/review"
                    element={
                      <ProtectedAdminRoute>
                        <AdminProductReviewPage />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/admin/settings"
                    element={
                      <ProtectedAdminRoute>
                        <AdminSettingsPage />
                      </ProtectedAdminRoute>
                    }
                  />
                </>
              ) : (
                <Route path="/admin/*" element={<Navigate to="/" replace />} />
              )}
                </>
              )}
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AdminAuthProvider>
  );
}

export default App;
