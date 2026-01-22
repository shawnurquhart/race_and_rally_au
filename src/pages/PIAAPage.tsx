import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PIAAPage: React.FC = () => {
  const menuItems = [
    'Lights',
    'Globes',
    'Other Products',
    'Integration Kits',
    'Dealers',
    'Motorsport',
    'Farming',
    'Mining',
    '4X4',
    'Emergency Services',
    'News'
  ];

  const [activeSection, setActiveSection] = useState('Lights');

  return (
    <div className="min-h-screen bg-black">
      {/* Main Content */}
      <section className="section-padding bg-black">
        <div className="container-narrow px-4 md:px-6">
          <Link to="/brands" className="inline-flex items-center text-motorsport-yellow mb-8 hover:underline">
            <ArrowLeft size={20} className="mr-2" />
            Back to Brands
          </Link>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">
              PIAA
            </h1>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto">
              Professional-grade lighting solutions for motorsport and off-road applications.
              PIAA represents the gold standard in performance lighting technology.
            </p>
          </div>
          
          {/* Main Layout: Left Menu + Right Content */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left-hand Vertical Menu */}
            <div className="lg:w-1/4">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 sticky top-8">
                <h2 className="text-xl font-heading font-bold mb-4 text-motorsport-yellow">Categories</h2>
                <nav className="space-y-1">
                  {menuItems.map((item) => (
                    <button
                      key={item}
                      onClick={() => setActiveSection(item)}
                      className={`w-full text-left px-4 py-3 rounded transition-colors ${
                        activeSection === item
                          ? 'bg-motorsport-yellow/20 text-motorsport-yellow border-l-4 border-motorsport-yellow'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="lg:w-3/4">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 md:p-8">
                {/* Section Heading */}
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight mb-8">
                  {activeSection}
                </h2>
                
                {/* Section Content Placeholder */}
                <div className="space-y-6">
                  <div className="bg-gray-800/50 border border-gray-700 p-6 rounded">
                    <p className="text-gray-400">
                      This section is currently under development. Content for {activeSection.toLowerCase()} will be added progressively.
                    </p>
                    <div className="mt-4 inline-block bg-motorsport-yellow/10 border border-motorsport-yellow/30 px-4 py-2 rounded">
                      <span className="text-motorsport-yellow font-medium">COMING SOON</span>
                    </div>
                  </div>
                  
                  {/* Additional placeholder content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-800/30 border border-gray-700 p-6 rounded">
                      <h3 className="text-xl font-heading font-bold mb-3">Product Overview</h3>
                      <p className="text-gray-400 text-sm">
                        Detailed product information, specifications, and features will be displayed here.
                      </p>
                    </div>
                    <div className="bg-gray-800/30 border border-gray-700 p-6 rounded">
                      <h3 className="text-xl font-heading font-bold mb-3">Technical Details</h3>
                      <p className="text-gray-400 text-sm">
                        Technical specifications, installation guides, and compatibility information.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-black border border-gray-800 p-8 text-center">
                    <p className="text-gray-300 mb-4">
                      "We're working on bringing you comprehensive information about PIAA {activeSection.toLowerCase()}."
                    </p>
                    <p className="text-gray-400 text-sm">
                      Check back soon for updates and detailed product listings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PIAAPage;
