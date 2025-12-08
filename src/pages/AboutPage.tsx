import React from 'react';
import { CheckCircle, Users, Target, Award } from 'lucide-react';
import WIPPlaceholder from '../components/WIPPlaceholder';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative bg-gray-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="relative z-10 container-narrow px-4 md:px-6 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-6">
              About Race & Rally <span className="text-motorsport-yellow">Australia</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              Professional motorsport equipment brand built on Australian rally expertise,
              performance without compromise, and a commitment to safety.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="section-padding bg-black">
        <div className="container-narrow px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">Our Mission</h2>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                To equip Australian motorsport professionals with race-proven gear that delivers
                uncompromising performance, safety, and reliability in the most demanding conditions.
              </p>
              <div className="space-y-4">
                {[
                  'Provide professional-grade motorsport equipment',
                  'Support Australian rally and off-road communities',
                  'Maintain the highest safety standards',
                  'Deliver expert technical support'
                ].map((item) => (
                  <div key={item} className="flex items-start">
                    <CheckCircle className="text-motorsport-yellow mt-1 mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-900 border border-gray-800 p-8">
              <h3 className="text-2xl font-heading font-bold mb-6 text-center">Our Values</h3>
              <div className="space-y-6">
                {[
                  { icon: Target, title: 'Performance', description: 'Race-proven equipment that delivers in extreme conditions' },
                  { icon: Award, title: 'Quality', description: 'Highest standards of construction and reliability' },
                  { icon: Users, title: 'Community', description: 'Supporting Australian motorsport professionals' },
                  { icon: CheckCircle, title: 'Safety', description: 'Uncompromising safety standards for all products' }
                ].map((value) => (
                  <div key={value.title} className="flex items-start">
                    <div className="bg-gray-800 p-2 rounded mr-4">
                      <value.icon className="text-motorsport-yellow" size={20} />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-lg mb-1">{value.title}</h4>
                      <p className="text-gray-400">{value.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team & Expertise - WIP Placeholder */}
      <section className="section-padding bg-gray-950">
        <div className="container-narrow px-4 md:px-6">
          <WIPPlaceholder
            title="Our Team & Expertise"
            description="We're currently preparing detailed information about our team of motorsport professionals, technical experts, and industry partners. This section will showcase our deep expertise in Australian rally conditions and professional motorsport equipment."
          />
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding bg-black border-t border-gray-800">
        <div className="container-narrow px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
            Ready to Experience Professional Motorsport Gear?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Contact our team for expert advice on equipment selection and technical specifications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="btn-primary">
              Contact Our Team
            </a>
            <a href="/gear" className="btn-secondary">
              Explore Gear Categories
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
