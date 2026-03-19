import React from 'react';
import PIAASectionPageShell from '@/components/piaa/PIAASectionPageShell';

const PIAADigitalCataloguePage: React.FC = () => {
  return (
    <PIAASectionPageShell
      title="Digital Catalogue + Smart Filter"
      intro="A future-ready shell for downloadable catalogue assets, searchable references, and filtered product lookups."
    >
      <section className="border border-gray-800 bg-gray-950 p-6 md:p-8 mb-6">
        <h2 className="text-2xl font-heading font-bold mb-3">Catalogue Viewer / Download</h2>
        <p className="text-sm text-gray-400 mb-4">
          Placeholder area for embedded digital catalogue viewing and downloadable PDF assets.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary">Download Catalogue (Placeholder)</button>
          <button className="btn-secondary">Open Viewer (Placeholder)</button>
        </div>
      </section>

      <section className="border border-gray-800 bg-gray-950 p-6 md:p-8 mb-6">
        <h2 className="text-2xl font-heading font-bold mb-3">Smart Filter UI Shell</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="border border-gray-800 bg-black p-3 text-sm text-gray-500">Search by SKU / keyword</div>
          <div className="border border-gray-800 bg-black p-3 text-sm text-gray-500">Filter by category</div>
          <div className="border border-gray-800 bg-black p-3 text-sm text-gray-500">Filter by application</div>
        </div>
        <p className="text-sm text-gray-400">Placeholder controls for future search and structured filtering logic.</p>
      </section>

      <section className="border border-gray-800 bg-gray-950 p-6 md:p-8">
        <h2 className="text-2xl font-heading font-bold mb-4">Product Reference Results</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((row) => (
            <div key={row} className="border border-gray-800 bg-black p-4 text-sm text-gray-300">
              Result row / card placeholder {row} — reserved for catalogue references and product links.
            </div>
          ))}
        </div>
      </section>
    </PIAASectionPageShell>
  );
};

export default PIAADigitalCataloguePage;
