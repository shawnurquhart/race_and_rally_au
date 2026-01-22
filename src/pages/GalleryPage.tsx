import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WIPPlaceholder from '../components/WIPPlaceholder';

const GalleryPage: React.FC = () => {
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
              Motorsport <span className="text-motorsport-yellow">Gallery</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              Capturing the intensity and excitement of Australian motorsport.
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="section-padding bg-black">
        <div className="container-narrow px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Featured Images</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              A glimpse into the world of professional rally racing and motorsport equipment.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Rally Action',
                category: 'Racing',
                image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
              },
              {
                title: 'Night Stage',
                category: 'Lighting',
                image: 'https://images.unsplash.com/photo-1593941707882-a5bba5338fe2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
              },
              {
                title: 'Off-Road Racing',
                category: 'Competition',
                image: 'https://images.unsplash.com/photo-1551524165-6b6e5a6166f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
              },
              {
                title: 'Technical Setup',
                category: 'Equipment',
                image: 'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
              },
              {
                title: 'Rally Preparation',
                category: 'Behind the Scenes',
                image: 'https://images.unsplash.com/photo-1519669556878-63bdad72289c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
              },
              {
                title: 'Team Work',
                category: 'Teamwork',
                image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
              }
            ].map((item, index) => (
              <div key={index} className="bg-gray-900 border border-gray-800 overflow-hidden group hover:border-motorsport-yellow/50 transition-colors cursor-pointer">
                <div 
                  className="h-64 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-300"
                  style={{ 
                    backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2)), url('${item.image}')` 
                  }}
                />
                <div className="p-4">
                  <div className="text-motorsport-yellow text-sm font-medium mb-1">{item.category}</div>
                  <h3 className="text-lg font-heading font-bold">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Gallery - WIP */}
      <section className="section-padding bg-gray-950">
        <div className="container-narrow px-4 md:px-6">
          <WIPPlaceholder
            title="Complete Gallery Coming Soon"
            description="We're building a comprehensive photo and video gallery showcasing professional motorsport events, equipment in action, and behind-the-scenes content from the Australian rally scene."
          />
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding bg-black border-t border-gray-800">
        <div className="container-narrow px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
            Share Your Photos
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Have great motorsport photography to share? Contact us to feature your work in our gallery.
          </p>
          <a href="/contact" className="btn-primary">
            Get In Touch
          </a>
        </div>
      </section>
    </div>
  );
};

export default GalleryPage;
