import React from 'react';

interface DealerCard {
  name: string;
  region: string;
  specialties: string;
  imageUrl: string;
}

const dealerHeroImage = new URL('../assets/graphics/piaa/piaa_page_2.PNG', import.meta.url).href;

const dealerCards: DealerCard[] = [
  {
    name: 'Outback Illumination Co.',
    region: 'Brisbane, QLD',
    specialties: 'Touring rigs, dual battery lighting, remote trip prep',
    imageUrl: new URL('../assets/graphics/piaa/piaa_jeep_1.PNG', import.meta.url).href,
  },
  {
    name: 'Summit Beam Specialists',
    region: 'Newcastle, NSW',
    specialties: 'Rally fit-outs, performance halogen & LED upgrades',
    imageUrl: new URL('../assets/graphics/piaa/piaa_gazoo_1.PNG', import.meta.url).href,
  },
  {
    name: 'Redline Lighting Garage',
    region: 'Melbourne, VIC',
    specialties: 'Street and track setups, driving light tuning',
    imageUrl: new URL('../assets/graphics/piaa/piaa_grille_1.PNG', import.meta.url).href,
  },
  {
    name: 'Frontier 4x4 Electrical',
    region: 'Perth, WA',
    specialties: 'Off-road bars, roof systems, dust-proof wiring',
    imageUrl: new URL('../assets/graphics/piaa/piaa_jeep_2.PNG', import.meta.url).href,
  },
  {
    name: 'Coastal Drive Solutions',
    region: 'Gold Coast, QLD',
    specialties: 'Marine-ready harnessing, corrosion-safe installs',
    imageUrl: new URL('../assets/graphics/piaa/piaa_page_1.PNG', import.meta.url).href,
  },
  {
    name: 'Iron Ridge Auto Electrics',
    region: 'Townsville, QLD',
    specialties: 'Mining fleet light bars, heavy-duty cab lighting',
    imageUrl: new URL('../assets/graphics/piaa/piaa_lamp_tech_4_lrg.PNG', import.meta.url).href,
  },
  {
    name: 'Track & Trail Dynamics',
    region: 'Adelaide, SA',
    specialties: 'ATV and buggy lighting systems, custom brackets',
    imageUrl: new URL('../assets/graphics/piaa/piaa_gazoo_2_lrg.PNG', import.meta.url).href,
  },
  {
    name: 'Northern Beacon Works',
    region: 'Darwin, NT',
    specialties: 'Emergency and defence vehicle integration',
    imageUrl: new URL('../assets/graphics/piaa/piaa_page_3.PNG', import.meta.url).href,
  },
];

const DealersPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <section className="section-padding bg-black">
        <div className="container-narrow px-4 md:px-6">
          <div
            className="relative overflow-hidden border border-gray-800 min-h-[280px] md:min-h-[360px] mb-10"
            style={{
              backgroundImage: `linear-gradient(120deg, rgba(0,0,0,0.9), rgba(0,0,0,0.55)), url(${dealerHeroImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
            <div className="relative z-10 p-8 md:p-12 max-w-3xl">
              <p className="text-motorsport-yellow text-sm uppercase tracking-[0.24em] mb-4">Dealer Network</p>
              <h1 className="text-4xl md:text-5xl font-heading font-bold leading-tight mb-4">Find an authorised dealer</h1>
              <p className="text-gray-200 text-base md:text-lg max-w-2xl">
                Connect with trusted Race & Rally partners across Australia for installation support, product advice,
                and specialist setup recommendations.
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3">Featured dealers</h2>
            <p className="text-gray-400 max-w-3xl">
              Explore our current dealer highlights. Each partner can help with fitment, upgrades, and ongoing support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {dealerCards.map((dealer) => (
              <article
                key={dealer.name}
                className="group relative overflow-hidden rounded-lg border border-gray-800 bg-gray-900 min-h-[320px]"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${dealer.imageUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/35 group-hover:from-black/95 group-hover:via-black/70" />

                <div className="relative z-10 flex h-full flex-col justify-end p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-motorsport-yellow mb-2">{dealer.region}</p>
                  <h3 className="text-xl font-heading font-bold text-white mb-2">{dealer.name}</h3>
                  <p className="text-sm text-gray-300 mb-4">{dealer.specialties}</p>
                  <button className="inline-flex w-fit items-center border border-motorsport-yellow px-3 py-1 text-sm font-semibold text-motorsport-yellow transition-colors group-hover:bg-motorsport-yellow group-hover:text-black">
                    View dealer profile
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DealersPage;
