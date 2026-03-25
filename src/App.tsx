import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AdminAuthProvider } from './auth/AdminAuthContext';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import PIAAPage from './pages/PIAAPage';
import PIAACatalogPage from './pages/PIAACatalogPage';
import AboutPage from './pages/AboutPage';
import BrandsPage from './pages/BrandsPage';
import ContactPage from './pages/ContactPage';
import DealersPage from './pages/DealersPage';
import EventsPage from './pages/EventsPage';
import GalleryPage from './pages/GalleryPage';
import GearPage from './pages/GearPage';
import NewsPage from './pages/NewsPage';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductUploadPage from './pages/admin/AdminProductUploadPage';
import AdminProductReviewPage from './pages/admin/AdminProductReviewPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import PIAAProductPage from './pages/PIAAProductPage';
import PIAAFindYourLightPage from './pages/PIAAFindYourLightPage';
import PIAATechnicalPage from './pages/PIAATechnicalPage';
import PIAAApplicationsPage from './pages/PIAAApplicationsPage';
import PIAASpotlightPage from './pages/PIAASpotlightPage';
import PIAADigitalCataloguePage from './pages/PIAADigitalCataloguePage';

function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/gear" element={<GearPage />} />
              <Route path="/brands" element={<BrandsPage />} />
              <Route path="/brands/piaa" element={<PIAAPage />} />
              <Route path="/brands/piaa/catalog" element={<PIAACatalogPage />} />
              <Route path="/brands/piaa/find-your-light" element={<PIAAFindYourLightPage />} />
              <Route path="/brands/piaa/technical" element={<PIAATechnicalPage />} />
              <Route path="/brands/piaa/applications" element={<PIAAApplicationsPage />} />
              <Route path="/brands/piaa/spotlight" element={<PIAASpotlightPage />} />
              <Route path="/brands/piaa/digital-catalogue" element={<PIAADigitalCataloguePage />} />
              <Route path="/brands/piaa/product/:productId" element={<PIAAProductPage />} />
              <Route path="/brands/piaa/catalog/product/:productId" element={<PIAAProductPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/dealers" element={<DealersPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
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
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AdminAuthProvider>
  );
}

export default App;
