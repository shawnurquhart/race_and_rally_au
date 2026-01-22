import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WIPPlaceholder from '../components/WIPPlaceholder';

const NewsPage: React.FC = () => {
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
              Motorsport <span className="text-motorsport-yellow">News</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              Latest updates from the world of Australian motorsport and rally racing.
            </p>
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="section-padding bg-black">
        <div className="container-narrow px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Latest News</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Stay informed with the latest developments in motorsport equipment and racing.
            </p>
          </div>
          
          <div className="space-y-6">
            {[
              {
                date: '12 December 2024',
                category: 'Partnership',
                title: 'New Partnership with PIAA',
                summary: 'Race & Rally Australia announces official partnership with premium lighting manufacturer PIAA, bringing world-class lighting solutions to the Australian motorsport community.',
                image: 'https://images.unsplash.com/photo-1593941707882-a5bba5338fe2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
              },
              {
                date: '5 December 2024',
                category: 'Guide',
                title: 'Winter Rally Preparation Guide',
                summary: 'Expert tips for preparing vehicles and equipment for winter rally conditions. Learn about essential gear, maintenance schedules, and safety considerations for cold weather racing.',
                image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
              },
              {
                date: '28 November 2024',
                category: 'Results',
                title: 'Australian Teams Excel Internationally',
                summary: 'Australian rally teams achieve podium finishes in international competition, showcasing the talent and preparation of our motorsport professionals on the world stage.',
                image: 'https://images.unsplash.com/photo-1551524165-6b6e5a6166f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
              },
              {
                date: '15 November 2024',
                category: 'Product News',
                title: 'New LED Lighting Technology',
                summary: 'Latest advancements in LED lighting technology provide superior visibility and performance for night rally stages and challenging weather conditions.',
                image: 'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
              }
            ].map((article, index) => (
              <div key={index} className="bg-gray-900 border border-gray-800 overflow-hidden hover:border-motorsport-yellow/50 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div 
                    className="h-48 md:h-auto bg-cover bg-center"
                    style={{ backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.3)), url('${article.image}')` }}
                  />
                  <div className="md:col-span-2 p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-motorsport-yellow text-sm font-medium">{article.date}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400 text-sm">{article.category}</span>
                    </div>
                    <h3 className="text-2xl font-heading font-bold mb-3">{article.title}</h3>
                    <p className="text-gray-300 mb-4">{article.summary}</p>
                    <button className="inline-flex items-center text-motorsport-yellow hover:text-motorsport-yellow/80 transition-colors text-sm font-medium">
                      Read full article <ChevronRight size={16} className="ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News Archive - WIP */}
      <section className="section-padding bg-gray-950">
        <div className="container-narrow px-4 md:px-6">
          <WIPPlaceholder
            title="News Archive & Blog Coming Soon"
            description="We're building a comprehensive news archive with articles, race reports, technical guides, and industry insights. Subscribe to stay updated with the latest motorsport news."
          />
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding bg-black border-t border-gray-800">
        <div className="container-narrow px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
            Have a Story to Share?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Contact us to share your motorsport news, race reports, or technical insights with the community.
          </p>
          <a href="/contact" className="btn-primary">
            Contact Us
          </a>
        </div>
      </section>
    </div>
  );
};

export default NewsPage;
