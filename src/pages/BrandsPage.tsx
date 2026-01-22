import React from 'react';
import { Link } from 'react-router-dom';

const BrandsPage: React.FC = () => {
  const brands = [
    { id: 'piaa', name: 'PIAA', description: 'Premium lighting solutions for motorsport' },
    // Add more brands as needed
  ];

  return (
    <div className="min-h-screen bg-black">
      <section className="section-padding bg-black">
        <div className="container-narrow px-4 md:px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">
              Our Brands
            </h1>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto">
              We partner with world-leading motorsport brands to bring you the highest quality equipment.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                to={`/brands/${brand.id}`}
                className="bg-gray-900 border border-gray-800 p-6 rounded-lg hover:border-motorsport-yellow/50 transition-colors"
              >
                <h2 className="text-2xl font-heading font-bold mb-3">{brand.name}</h2>
                <p className="text-gray-400 mb-4">{brand.description}</p>
                <div className="text-motorsport-yellow font-medium">
                  View Products →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BrandsPage;
