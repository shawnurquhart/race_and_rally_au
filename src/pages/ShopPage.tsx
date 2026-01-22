import React from 'react';
import { ArrowLeft, ShoppingCart, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WIPPlaceholder from '../components/WIPPlaceholder';

const ShopPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black">
      {/* Back Button */}
      <div className="bg-gray-950 border-b border-gray-800">
        <div className="container-narrow px-4 md:px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-motorsport-yellow hover:text-motorsport-yellow/80 transition-colors"
          >
            <ArrowLeft className="mr-2" size={20} />
            Back
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gray-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="relative z-10 container-narrow px-4 md:px-6 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-6">
              Online <span className="text-motorsport-yellow">Shop</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              Professional motorsport equipment delivered to your door.
            </p>
          </div>
        </div>
      </section>

      {/* Coming Soon Notice */}
      <section className="section-padding bg-black">
        <div className="container-narrow px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-motorsport-yellow/10 border border-motorsport-yellow/30 rounded-lg p-8 mb-12">
              <ShoppingCart className="text-motorsport-yellow mx-auto mb-4" size={48} />
              <h2 className="text-3xl font-heading font-bold mb-4">Online Store Launching Soon</h2>
              <p className="text-gray-300 text-lg mb-6">
                We're currently preparing our online retail platform with our complete product catalog, 
                secure checkout, and fast shipping across Australia.
              </p>
              <div className="inline-flex items-center text-motorsport-yellow">
                <Package className="mr-2" size={20} />
                <span className="font-medium">Stage 2: Commerce & Catalog</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="section-padding bg-gray-950">
        <div className="container-narrow px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">What to Expect</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our online store will feature comprehensive product listings and professional service.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: 'Complete Product Catalog',
                description: 'Browse our full range of motorsport equipment with detailed specifications and pricing.'
              },
              {
                title: 'Secure Online Ordering',
                description: 'Safe and secure checkout with multiple payment options for your convenience.'
              },
              {
                title: 'Fast Australian Shipping',
                description: 'Quick delivery across Australia with tracking and insurance on all orders.'
              },
              {
                title: 'Expert Product Support',
                description: 'Technical assistance and product advice from our motorsport professionals.'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-900 border border-gray-800 p-6">
                <h3 className="text-xl font-heading font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* E-commerce Platform - WIP */}
      <section className="section-padding bg-black">
        <div className="container-narrow px-4 md:px-6">
          <WIPPlaceholder
            title="E-Commerce Platform in Development"
            description="We're building a comprehensive online shopping experience with product filters, detailed specifications, customer reviews, and secure payment processing. Stay tuned for our official launch."
          />
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding bg-gray-950 border-t border-gray-800">
        <div className="container-narrow px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
            Need Equipment Now?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Contact our team directly for immediate equipment inquiries and custom orders.
          </p>
          <a href="/contact" className="btn-primary">
            Contact Us
          </a>
        </div>
      </section>
    </div>
  );
};

export default ShopPage;
