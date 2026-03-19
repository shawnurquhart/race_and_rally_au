import React from 'react';
import PIAASectionPageShell from '@/components/piaa/PIAASectionPageShell';

const PIAAFindYourLightPage: React.FC = () => {
  return (
    <PIAASectionPageShell
      title="Find Your Light"
      intro="A guided selector experience to help drivers choose the right PIAA lighting setup by vehicle type, use case, and driving conditions."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border border-gray-800 bg-gray-950 p-5">
          <p className="text-xs uppercase tracking-wide text-motorsport-yellow mb-2">Step 1</p>
          <h3 className="text-xl font-heading font-bold mb-2">Vehicle Type</h3>
          <p className="text-sm text-gray-400">Placeholder options for 4WD, rally, touring, and daily driver setups.</p>
        </div>
        <div className="border border-gray-800 bg-gray-950 p-5">
          <p className="text-xs uppercase tracking-wide text-motorsport-yellow mb-2">Step 2</p>
          <h3 className="text-xl font-heading font-bold mb-2">Driving / Use Case</h3>
          <p className="text-sm text-gray-400">Placeholder guidance for stage rally, highway touring, trails, and worksite use.</p>
        </div>
        <div className="border border-gray-800 bg-gray-950 p-5">
          <p className="text-xs uppercase tracking-wide text-motorsport-yellow mb-2">Step 3</p>
          <h3 className="text-xl font-heading font-bold mb-2">Conditions</h3>
          <p className="text-sm text-gray-400">Placeholder condition filters for dust, rain, fog, distance, and peripheral spread.</p>
        </div>
      </div>

      <div className="border border-gray-800 bg-gray-950 p-6">
        <h3 className="text-2xl font-heading font-bold mb-4">Recommended Product Results (Placeholder)</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="border border-gray-800 bg-black p-4">
              <p className="text-sm text-motorsport-yellow mb-2">Recommendation {item}</p>
              <h4 className="font-heading font-semibold mb-2">Suggested product block</h4>
              <p className="text-sm text-gray-400">
                Placeholder for future recommendation logic, including rationale, beam profile and quick CTA.
              </p>
            </div>
          ))}
        </div>
      </div>
    </PIAASectionPageShell>
  );
};

export default PIAAFindYourLightPage;
