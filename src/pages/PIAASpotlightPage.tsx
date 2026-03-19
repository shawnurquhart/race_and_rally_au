import React from 'react';
import { Link } from 'react-router-dom';
import PIAASectionPageShell from '@/components/piaa/PIAASectionPageShell';

const PIAASpotlightPage: React.FC = () => {
  return (
    <PIAASectionPageShell
      title="Featured Product / Spotlight"
      intro="Marketing-led feature space for spotlight products, launches, and curated editorial picks."
    >
      <section className="border border-gray-800 bg-gray-950 mb-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr]">
          <div className="min-h-[280px] bg-gradient-to-br from-gray-900 to-black border-b lg:border-b-0 lg:border-r border-gray-800 flex items-center justify-center text-gray-500 text-sm">
            Featured product image area
          </div>
          <div className="p-6 md:p-8">
            <p className="text-xs uppercase tracking-wide text-motorsport-yellow mb-2">Current spotlight</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3">Featured Product Placeholder</h2>
            <p className="text-gray-300 mb-5">
              Replace with final product narrative. Include a concise value statement and positioning message.
            </p>
            <ul className="space-y-2 text-sm text-gray-400 mb-6">
              <li>• Key spec placeholder 1</li>
              <li>• Key spec placeholder 2</li>
              <li>• Key spec placeholder 3</li>
            </ul>
            <Link to="/brands/piaa/catalog" className="btn-primary inline-flex items-center">
              Shop this Product
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['New Product', 'Best Seller', "Editor's Pick"].map((label) => (
          <article key={label} className="border border-gray-800 bg-gray-950 p-5">
            <p className="text-xs uppercase tracking-wide text-motorsport-yellow mb-2">Content block</p>
            <h3 className="text-xl font-heading font-bold mb-2">{label}</h3>
            <p className="text-sm text-gray-400">Placeholder block for future campaign content and links.</p>
          </article>
        ))}
      </section>
    </PIAASectionPageShell>
  );
};

export default PIAASpotlightPage;
