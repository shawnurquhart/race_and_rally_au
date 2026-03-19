import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import PIAASubNav from './PIAASubNav';

interface PIAASectionPageShellProps {
  title: string;
  intro: string;
  children: React.ReactNode;
}

const PIAASectionPageShell: React.FC<PIAASectionPageShellProps> = ({ title, intro, children }) => {
  return (
    <div className="min-h-screen bg-black">
      <section className="section-padding bg-black">
        <div className="container-narrow px-4 md:px-6">
          <Link to="/brands/piaa" className="inline-flex items-center text-motorsport-yellow mb-6 hover:underline">
            <ArrowLeft size={20} className="mr-2" />
            Back to PIAA Hub
          </Link>

          <PIAASubNav />

          <div className="border border-gray-800 bg-gray-950 p-6 md:p-8 mb-8">
            <h1 className="text-3xl md:text-5xl font-heading font-bold mb-4">{title}</h1>
            <p className="text-gray-300 max-w-3xl">{intro}</p>
          </div>

          {children}
        </div>
      </section>
    </div>
  );
};

export default PIAASectionPageShell;
