import React from 'react';
import PIAASectionPageShell from '@/components/piaa/PIAASectionPageShell';

const technicalTopics = [
  'Beam patterns',
  'Spot vs flood vs combo',
  'Colour temperature',
  'Reflector Facing Technology',
  'Installation / wiring guidance',
];

const PIAATechnicalPage: React.FC = () => {
  return (
    <PIAASectionPageShell
      title="Technical Knowledge Hub"
      intro="Educational content scaffolding for PIAA lighting technology, setup principles, and installation best practices."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {technicalTopics.map((topic) => (
          <article key={topic} className="border border-gray-800 bg-gray-950 p-6">
            <p className="text-xs uppercase tracking-wide text-motorsport-yellow mb-2">Technical topic</p>
            <h3 className="text-2xl font-heading font-bold mb-3">{topic}</h3>
            <p className="text-sm text-gray-400 mb-4">
              Placeholder educational summary content for {topic.toLowerCase()}. Replace with production content and media.
            </p>
            <button className="text-sm border border-gray-700 px-3 py-1 text-gray-300 hover:text-white hover:border-gray-500 transition-colors">
              Expand article
            </button>
          </article>
        ))}
      </div>
    </PIAASectionPageShell>
  );
};

export default PIAATechnicalPage;
