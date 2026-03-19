import React from 'react';
import PIAASectionPageShell from '@/components/piaa/PIAASectionPageShell';

const builds = ['4WD Builds', 'Rally Cars', 'Touring Setups', 'Daily Driver Examples'];

const PIAAApplicationsPage: React.FC = () => {
  return (
    <PIAASectionPageShell
      title="Real-World Applications"
      intro="A case-study style gallery shell for customer builds and real-world PIAA lighting applications."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {builds.map((build) => (
          <article key={build} className="border border-gray-800 bg-gray-950 overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-gray-900 to-black border-b border-gray-800 flex items-center justify-center text-gray-500 text-sm">
              Placeholder image area
            </div>
            <div className="p-5">
              <h3 className="text-2xl font-heading font-bold mb-2">{build}</h3>
              <p className="text-sm text-gray-400 mb-3">
                Placeholder description for this build category, including intended conditions and setup outcomes.
              </p>
              <p className="text-xs text-gray-500 mb-4">Products used: placeholder references</p>
              <button className="text-sm border border-motorsport-yellow text-motorsport-yellow px-3 py-1 hover:bg-motorsport-yellow hover:text-black transition-colors">
                Future build detail CTA
              </button>
            </div>
          </article>
        ))}
      </div>
    </PIAASectionPageShell>
  );
};

export default PIAAApplicationsPage;
