import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import PIAATileCard from '@/components/piaa/PIAATileCard';
import PIAASubNav from '@/components/piaa/PIAASubNav';

const piaaHeroImage = new URL('../assets/graphics/piaa/piaa_page_1.PNG', import.meta.url).href;
const piaaShopImage = new URL('../assets/graphics/piaa/piaa_range_1.PNG', import.meta.url).href;
const piaaFindImage = new URL('../assets/graphics/piaa/piaa_jeep_2.PNG', import.meta.url).href;
const piaaTechnicalImage = new URL('../assets/graphics/piaa/piaa_lamp_tech_2.PNG', import.meta.url).href;
const piaaApplicationsImage = new URL('../assets/graphics/piaa/piaa_gazoo_2.PNG', import.meta.url).href;
const piaaSpotlightImage = new URL('../assets/graphics/piaa/piaa_grille_1.PNG', import.meta.url).href;
const piaaDigitalCatalogueImage = new URL('../assets/graphics/piaa/piaa_page_3.PNG', import.meta.url).href;

const PIAAPage: React.FC = () => {
  const tiles = [
    {
      title: 'Shop Catalogue',
      description: 'Browse the full PIAA product range with category navigation and live cart support.',
      ctaLabel: 'Open Catalogue',
      to: '/brands/piaa/catalog',
      imageUrl: piaaShopImage,
    },
    {
      title: 'Find Your Light',
      description: 'Use case-led guidance to match your vehicle, driving style, and conditions.',
      ctaLabel: 'Start Selector',
      to: '/brands/piaa/find-your-light',
      imageUrl: piaaFindImage,
    },
    {
      title: 'Technical Knowledge Hub',
      description: 'Learn beam patterns, colour temperature, and installation fundamentals.',
      ctaLabel: 'Explore Technical Guides',
      to: '/brands/piaa/technical',
      imageUrl: piaaTechnicalImage,
    },
    {
      title: 'Real-World Applications',
      description: 'See practical setups from 4WD builds, rally cars, tourers, and daily drivers.',
      ctaLabel: 'View Builds',
      to: '/brands/piaa/applications',
      imageUrl: piaaApplicationsImage,
    },
    {
      title: 'Featured Product / Spotlight',
      description: 'Discover current feature products, key specifications, and curated highlights.',
      ctaLabel: 'View Spotlight',
      to: '/brands/piaa/spotlight',
      imageUrl: piaaSpotlightImage,
    },
    {
      title: 'Digital Catalogue',
      description: 'Access catalogue downloads and future-ready smart filtering references.',
      ctaLabel: 'Open Digital Catalogue',
      to: '/brands/piaa/digital-catalogue',
      imageUrl: piaaDigitalCatalogueImage,
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <section className="section-padding bg-black">
        <div className="container-narrow px-4 md:px-6">
          <Link to="/brands" className="inline-flex items-center text-motorsport-yellow mb-6 hover:underline">
            <ArrowLeft size={20} className="mr-2" />
            Back to Brands
          </Link>

          <PIAASubNav />

          <div
            className="relative overflow-hidden border border-gray-800 min-h-[360px] md:min-h-[460px] mb-8"
            style={{
              backgroundImage: `linear-gradient(120deg, rgba(0,0,0,0.92), rgba(0,0,0,0.62)), url(${piaaHeroImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
            <div className="relative z-10 p-8 md:p-12 lg:p-16 max-w-3xl">
              <p className="text-motorsport-yellow text-sm uppercase tracking-[0.24em] mb-4">PIAA Lighting</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight mb-4">
                Performance lighting for race, rally & off-road
              </h1>
              <p className="text-gray-200 text-base md:text-lg max-w-2xl">
                Enter the PIAA hub to shop proven products, explore technical guidance, and discover real-world builds.
                This page connects every major PIAA content area in one branded experience.
              </p>
              <div className="mt-6">
                <Link to="/brands/piaa/catalog" className="btn-primary inline-flex items-center">
                  Shop Catalogue
                </Link>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3">Explore PIAA</h2>
            <p className="text-gray-400 max-w-3xl">
              Choose a pathway below to shop products, compare technical options, or plan your next lighting setup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tiles.map((tile) => (
              <PIAATileCard key={tile.to} {...tile} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PIAAPage;
