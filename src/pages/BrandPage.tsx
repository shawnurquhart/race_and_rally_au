import React from 'react';
import { ArrowLeft, CheckCircle, Shield, Zap, Award } from 'lucide-react';
import WIPPlaceholder from '../components/WIPPlaceholder';

interface BrandPageProps {
  brandName: string;
  brandDescription: string;
  heroImage?: string;
  features: string[];
  isPIAA?: boolean;
}

const BrandPage: React.FC<BrandPageProps> = ({
  brandName,
  brandDescription,
  features,
  isPIAA = false,
}) => {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative bg-gray-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="relative z-10 container-narrow px-4 md:px-6 py-24">
          <div className="max-w-4xl mx-auto">
            <a href="/brands" className="inline-flex items-center text-motorsport-yellow mb-8 hover:underline">
              <ArrowLeft size={20} className="mr-2" />
              Back to Brands
            </a>
            
            <div className="mb-8">
              {isPIAA && (
                <div className="inline-block bg-motorsport-yellow/10 border border-motorsport-yellow/30 px-4 py-2 rounded mb-4">
                  <span className="text-motorsport-yellow font-medium">FEATURED BRAND</span>
                </div>
              )}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-6">
                {brandName}
              </h1>
            </div>
            
            <div className="bg-gray-900 border border-gray-800 p-8 md:p-12">
              <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-8">
                {brandDescription}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-heading font-bold mb-6">Key Features</h3>
                  <div className="space-y-4">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <CheckCircle className="text-motorsport-yellow mt-1 mr-3 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-black border border-gray-800 p-6">
                  <h3 className="text-xl font-heading font-bold mb-4">Brand Highlights</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Shield className="text-motorsport-yellow mr-3" size={20} />
                      <span className="text-gray-300">Professional Motorsport Grade</span>
                    </div>
                    <div className="flex items-center">
                      <Zap className="text-motorsport-yellow mr-3" size={20} />
                      <span className="text-gray-300">Performance Tested</span>
                    </div>
                    <div className="flex items-center">
                      <Award className="text-motorsport-yellow mr-3" size={20} />
                      <span className="text-gray-300">Race Proven</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Range - WIP Placeholder */}
      <section className="section-padding bg-black">
        <div className="container-narrow px-4 md:px-6">
          <WIPPlaceholder
            title={`${brandName} Product Range`}
            description={`We're currently preparing the full ${brandName} product range and technical catalogue. Our team is working to ensure every product meets our rigorous standards for performance, safety, and reliability.`}
          />
        </div>
      </section>

      {/* Technical Information */}
      <section className="section-padding bg-gray-950">
        <div className="container-narrow px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Technical Excellence
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {brandName} products are engineered for professional motorsport applications.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Performance Specifications',
                description: 'Detailed technical specifications and performance data.',
                status: 'In Preparation'
              },
              {
                title: 'Installation Guides',
                description: 'Professional installation instructions and best practices.',
                status: 'Coming Soon'
              },
              {
                title: 'Technical Support',
                description: 'Expert technical support for professional applications.',
                status: 'Available'
              }
            ].map((item, index) => (
              <div key={index} className="bg-gray-900 border border-gray-800 p-6">
                <h3 className="text-xl font-heading font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400 mb-4">{item.description}</p>
                <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                  item.status === 'Available' 
                    ? 'bg-green-900/30 text-green-400 border border-green-800'
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}>
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding bg-black border-t border-gray-800">
        <div className="container-narrow px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
            Interested in {brandName} Products?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Contact our technical team for professional advice and product information.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="btn-primary">
              Contact Technical Team
            </a>
            <a href="/brands" className="btn-secondary">
              Explore Other Brands
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BrandPage;
