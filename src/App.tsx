import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import PIAAPage from './pages/PIAAPage';
import AboutPage from './pages/AboutPage';
import BrandsPage from './pages/BrandsPage';
import ContactPage from './pages/ContactPage';
import EventsPage from './pages/EventsPage';
import GalleryPage from './pages/GalleryPage';
import GearPage from './pages/GearPage';
import NewsPage from './pages/NewsPage';
import ShopPage from './pages/ShopPage';

function App() {
  return (
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
            <Route path="/events" element={<EventsPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/shop" element={<ShopPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
