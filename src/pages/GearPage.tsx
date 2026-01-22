import React from 'react';
import { ArrowLeft, Package, Shield, Zap, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WIPPlaceholder from '../components/WIPPlaceholder';

const GearPage: React.FC = () => {
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
              Professional <span className="text-motorsport-yellow">Motorsport Gear</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              Race-proven equipment for serious motorsport professionals. Performance without compromise.
            </p>
          </div>
        </div>
      </section>

      {/* Gear Categories */}
      <section className="section-padding bg-black">
        <div className="container-narrow px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Gear Categories</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Professional motorsport equipment categories. Online store launching soon.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: 'Lighting', description: 'Premium LED and HID lighting solutions for all conditions' },
              { icon: Package, title: 'Accessories', description: 'Essential equipment and mounting solutions' },
              { icon: Shield, title: 'Safety Gear', description: 'Professional-grade safety equipment and protection' },
              { icon: Award, title: 'Merchandise', description: 'Official Race & Rally Australia branded items' }
            ].map((category) => (
              <div key={category.title} className="bg-gray-900 border border-gray-800 p-8 hover:border-motorsport-yellow/50 transition-colors">
                <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <category.icon className="text-motorsport-yellow" size={28} />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3 text-center">{category.title}</h3>
                <p className="text-gray-400 text-center">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Catalog - WIP */}
      <section className="section-padding bg-gray-950">
        <div className="container-narrow px-4 md:px-6">
          <WIPPlaceholder
            title="Product Catalog Coming Soon"
            description="We're currently preparing our complete product catalog with detailed specifications, pricing, and online ordering capabilities. This section will feature our full range of professional motorsport equipment."
          />
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding bg-black border-t border-gray-800">
        <div className="container-narrow px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
            Need Equipment Advice?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Contact our team for expert recommendations on equipment selection and technical specifications.
          </p>
          <a href="/contact" className="btn-primary">
            Contact Our Team
          </a>
        </div>
      </section>
    </div>
  );
};

export default GearPage;
