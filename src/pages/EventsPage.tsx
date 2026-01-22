import React from 'react';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WIPPlaceholder from '../components/WIPPlaceholder';

const EventsPage: React.FC = () => {
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
              Motorsport <span className="text-motorsport-yellow">Events</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              Stay updated with the latest rallies, races, and motorsport events across Australia.
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming Events Preview */}
      <section className="section-padding bg-black">
        <div className="container-narrow px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Upcoming Events</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Major motorsport events and races happening across Australia.
            </p>
          </div>
          
          <div className="space-y-6">
            {[
              {
                date: '15-17 March 2025',
                title: 'Australian Rally Championship - Round 1',
                location: 'Victoria',
                description: 'Opening round of the national championship featuring the best rally teams in Australia.'
              },
              {
                date: '5-7 April 2025',
                title: 'Off-Road Expo Melbourne',
                location: 'Melbourne Convention Centre',
                description: 'Major industry exhibition featuring latest equipment and technology from leading brands.'
              },
              {
                date: '10-12 May 2025',
                title: 'Motorsport Safety Conference',
                location: 'Sydney',
                description: 'Industry conference focusing on safety innovations and best practices in motorsport.'
              },
              {
                date: '20-22 June 2025',
                title: 'Australian Rally Championship - Round 2',
                location: 'Queensland',
                description: 'Second round featuring challenging terrain and diverse weather conditions.'
              }
            ].map((event, index) => (
              <div key={index} className="bg-gray-900 border border-gray-800 p-6 hover:border-motorsport-yellow/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="bg-gray-800 p-4 rounded text-center min-w-[120px]">
                    <Calendar className="text-motorsport-yellow mx-auto mb-2" size={24} />
                    <div className="text-motorsport-yellow text-sm font-medium">{event.date}</div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-2xl font-heading font-bold mb-2">{event.title}</h3>
                    <div className="flex items-center text-gray-400 mb-3">
                      <MapPin size={16} className="mr-2" />
                      {event.location}
                    </div>
                    <p className="text-gray-300">{event.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Calendar - WIP */}
      <section className="section-padding bg-gray-950">
        <div className="container-narrow px-4 md:px-6">
          <WIPPlaceholder
            title="Full Event Calendar Coming Soon"
            description="We're developing a comprehensive event calendar with detailed schedules, registration information, and live updates from major motorsport events across Australia."
          />
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding bg-black border-t border-gray-800">
        <div className="container-narrow px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
            Want to Stay Updated?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Contact us to receive notifications about upcoming events and motorsport news.
          </p>
          <a href="/contact" className="btn-primary">
            Get In Touch
          </a>
        </div>
      </section>
    </div>
  );
};

export default EventsPage;
