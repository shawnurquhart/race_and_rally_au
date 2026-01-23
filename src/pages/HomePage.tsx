import React, { useEffect, useRef } from 'react';
import { ChevronRight, CheckCircle, Shield, Award, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        heroRef.current.style.transform = `translate3d(0, ${rate}px, 0)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Hero Section with Parallax */}
      <section className="relative h-screen overflow-hidden">
        {/* Parallax Background */}
        <div 
          ref={heroRef}
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(135deg, #000000 0%, #1a1a1a 25%, #333333 50%, #1a1a1a 75%, #000000 100%), url('https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2850&q=80')`,
            backgroundPosition: 'center 30%',
            backgroundBlendMode: 'overlay',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
          {/* Pattern overlay for texture */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23FFFB00' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }} />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="container-narrow px-4 md:px-6">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight mb-6">
                Race-Proven Performance Gear for{' '}
                <span className="text-motorsport-yellow">Australian Conditions</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed">
                Professional motorsport equipment. No compromises. Built for rally professionals,
                off-road enthusiasts, and motorsport teams who demand the best.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/gear" className="btn-primary inline-flex items-center justify-center">
                  View Gear <ChevronRight className="ml-2" size={20} />
                </Link>
                <Link to="/brands" className="btn-secondary inline-flex items-center justify-center">
                  Explore Brands
                </Link>
                <Link to="/events" className="btn-secondary inline-flex items-center justify-center">
                  Upcoming Events
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="animate-bounce">
            <ChevronRight className="text-motorsport-yellow rotate-90" size={24} />
          </div>
        </div>
      </section>

      {/* About / Mission Section with Image */}
      <section className="section-padding bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(45deg, #111111 25%, transparent 25%, transparent 50%, #111111 50%, #111111 75%, transparent 75%, transparent), url('https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2850&q=80')`,
              backgroundSize: '60px 60px, cover',
              backgroundBlendMode: 'overlay',
            }}
          />
        </div>
        <div className="relative z-10 container-narrow px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
                Motorsport-Grade Equipment, Australian Expertise
              </h2>
              <p className="text-gray-300 text-lg mb-6">
                Race & Rally Australia is built on a foundation of professional motorsport
                experience. We understand the unique demands of Australian terrain and climate,
                and we source equipment that meets the highest standards of performance and safety.
              </p>
              <div className="space-y-4">
                {['Safety without compromise', 'Performance in extreme conditions', 'Reliability you can trust', 'Supporting professional motorsport culture'].map((item) => (
                  <div key={item} className="flex items-start">
                    <CheckCircle className="text-motorsport-yellow mt-1 mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gray-900 border border-gray-800 p-8 relative z-10">
                <h3 className="text-2xl font-heading font-bold mb-4 text-center">Our Mission</h3>
                <p className="text-gray-300 text-center mb-6">
                  To equip Australian motorsport professionals with race-proven gear that delivers
                  uncompromising performance, safety, and reliability in the most demanding conditions.
                </p>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-black p-4 border border-gray-800">
                    <div className="text-motorsport-yellow font-bold text-2xl mb-2">100%</div>
                    <div className="text-gray-400 text-sm">Race Tested</div>
                  </div>
                  <div className="bg-black p-4 border border-gray-800">
                    <div className="text-motorsport-yellow font-bold text-2xl mb-2">24/7</div>
                    <div className="text-gray-400 text-sm">Expert Support</div>
                  </div>
                </div>
              </div>
              {/* Decorative Pattern */}
              <div 
                className="absolute -right-4 -top-4 w-32 h-32 bg-cover bg-center rounded-lg opacity-20"
                style={{
                  backgroundImage: `linear-gradient(45deg, #FFFB00 25%, transparent 25%, transparent 50%, #FFFB00 50%, #FFFB00 75%, transparent 75%, transparent), url('https://images.unsplash.com/photo-1519669556878-63bdad72289c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80')`,
                  backgroundSize: '20px 20px, cover',
                  backgroundBlendMode: 'overlay',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Race & Rally Australia - Value Tiles */}
      <section className="section-padding bg-black">
        <div className="container-narrow px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Why Race & Rally Australia
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Four pillars of excellence that define our commitment to professional motorsport.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Award,
                title: 'Race-Proven Performance',
                description: 'Equipment tested and validated in competitive motorsport environments.'
              },
              {
                icon: Shield,
                title: 'Safety Without Compromise',
                description: 'Highest safety standards for protection in extreme conditions.'
              },
              {
                icon: Globe,
                title: 'Trusted Global Brands',
                description: 'Curated selection of world-leading motorsport manufacturers.'
              },
              {
                icon: Award,
                title: 'Australian Rally Expertise',
                description: 'Deep understanding of local terrain, climate, and racing conditions.'
              }
            ].map((value, index) => (
              <div key={index} className="bg-gray-900 border border-gray-800 p-6 hover:border-motorsport-yellow/50 transition-colors">
                <div className="bg-gray-800 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <value.icon className="text-motorsport-yellow" size={24} />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3">{value.title}</h3>
                <p className="text-gray-400">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Gear - Pre-Commerce */}
      <section className="section-padding bg-gray-950">
        <div className="container-narrow px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Featured Gear</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Professional motorsport equipment categories. Online store launching soon.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {['Lighting', 'Accessories', 'Safety Gear', 'Merchandise'].map((category) => (
              <div key={category} className="bg-gray-900 border border-gray-800 p-8 text-center group hover:border-motorsport-yellow transition-colors">
                <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-700 transition-colors">
                  <Award className="text-motorsport-yellow" size={28} />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3">{category}</h3>
                <p className="text-gray-400 text-sm">
                  Professional-grade equipment for motorsport applications.
                </p>
              </div>
            ))}
          </div>
          
          <div className="bg-black border border-gray-800 p-8 text-center">
            <p className="text-xl text-gray-300 mb-4">
              "Online store launching soon. We're currently preparing our retail catalogue."
            </p>
            <p className="text-gray-400">
              Stage 1: Brand & Structure • Stage 2: Commerce & Catalog
            </p>
            {/* TODO: Stage 2 - Replace with actual product listings and e-commerce functionality */}
          </div>
        </div>
      </section>

      {/* Featured Brand - PIAA (Key Requirement) with Image */}
      <section className="section-padding bg-black border-y border-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-5">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `radial-gradient(circle at 30% 50%, #333333 0%, #111111 50%, #000000 100%), url('https://images.unsplash.com/photo-1551524165-6b6e5a6166f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2850&q=80')`,
              backgroundPosition: 'center 70%',
              backgroundBlendMode: 'overlay',
            }}
          />
        </div>
        <div className="relative z-10 container-narrow px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-motorsport-yellow/10 border border-motorsport-yellow/30 px-4 py-2 rounded mb-6">
                <span className="text-motorsport-yellow font-medium">FEATURED BRAND</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                PIAA
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                World-renowned for premium lighting solutions in motorsport. PIAA's advanced
                lighting technology delivers exceptional performance in the most demanding
                conditions, from night rallies to off-road adventures.
              </p>
              <div className="space-y-4 mb-8">
                {['Advanced LED Technology', 'Rally-Proven Durability', 'Superior Light Output', 'Professional Motorsport Heritage'].map((feature) => (
                  <div key={feature} className="flex items-center">
                    <CheckCircle className="text-motorsport-yellow mr-3" size={20} />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
              <Link to="/brands/piaa" className="btn-primary inline-flex items-center">
                View PIAA Range <ChevronRight className="ml-2" size={20} />
              </Link>
            </div>
            <div className="relative">
              <div className="bg-gray-900/90 border border-gray-800 p-8 backdrop-blur-sm">
                <div className="aspect-video bg-gray-800/50 flex items-center justify-center mb-6 overflow-hidden rounded-lg">
                  <div 
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(26,26,26,0.7) 50%, rgba(0,0,0,0.7) 100%), url('https://images.unsplash.com/photo-1593941707882-a5bba5338fe2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')`,
                      backgroundBlendMode: 'overlay',
                    }}
                  >
                    <div className="w-full h-full bg-black/30 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-white mb-2">PIAA</div>
                        <div className="text-motorsport-yellow">Premium Lighting Solutions</div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-400 text-center">
                  Official partner of Race & Rally Australia. Professional-grade lighting for
                  motorsport applications.
                </p>
              </div>
              {/* Decorative Element */}
              <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-motorsport-yellow/10 rounded-full" />
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-motorsport-yellow/5 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Events & News Preview */}
      <section className="section-padding bg-gray-950">
        <div className="container-narrow px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Events */}
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-8">Upcoming Events</h2>
              <div className="space-y-6">
                {[
                  {
                    date: '15-17 March 2025',
                    title: 'Australian Rally Championship - Round 1',
                    summary: 'Opening round of the national championship in Victoria.'
                  },
                  {
                    date: '5-7 April 2025',
                    title: 'Off-Road Expo Melbourne',
                    summary: 'Major industry exhibition featuring latest equipment and technology.'
                  },
                  {
                    date: '10-12 May 2025',
                    title: 'Motorsport Safety Conference',
                    summary: 'Industry conference focusing on safety innovations in motorsport.'
                  }
                ].map((event, index) => (
                  <div key={index} className="bg-gray-900 border border-gray-800 p-6 hover:border-gray-700 transition-colors">
                    <div className="text-motorsport-yellow text-sm font-medium mb-2">{event.date}</div>
                    <h3 className="text-xl font-heading font-bold mb-3">{event.title}</h3>
                    <p className="text-gray-400">{event.summary}</p>
                  </div>
                ))}
              </div>
              <a href="/events" className="inline-flex items-center text-motorsport-yellow mt-6 text-sm font-medium">
                View All Events <ChevronRight size={16} className="ml-1" />
              </a>
            </div>

            {/* News */}
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-8">Latest News</h2>
              <div className="space-y-6">
                {[
                  {
                    date: '12 December 2024',
                    title: 'New Partnership with PIAA',
                    summary: 'Race & Rally Australia announces official partnership with premium lighting manufacturer.'
                  },
                  {
                    date: '5 December 2024',
                    title: 'Winter Rally Preparation Guide',
                    summary: 'Expert tips for preparing vehicles and equipment for winter rally conditions.'
                  },
                  {
                    date: '28 November 2024',
                    title: 'Australian Teams Excel Internationally',
                    summary: 'Australian rally teams achieve podium finishes in international competition.'
                  }
                ].map((news, index) => (
                  <div key={index} className="bg-gray-900 border border-gray-800 p-6 hover:border-gray-700 transition-colors">
                    <div className="text-motorsport-yellow text-sm font-medium mb-2">{news.date}</div>
                    <h3 className="text-xl font-heading font-bold mb-3">{news.title}</h3>
                    <p className="text-gray-400">{news.summary}</p>
                    <a href="/news" className="inline-flex items-center text-motorsport-yellow mt-4 text-sm font-medium">
                      Read article <ChevronRight size={16} className="ml-1" />
                    </a>
                  </div>
                ))}
              </div>
              <a href="/news" className="inline-flex items-center text-motorsport-yellow mt-6 text-sm font-medium">
                Read All News <ChevronRight size={16} className="ml-1" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
