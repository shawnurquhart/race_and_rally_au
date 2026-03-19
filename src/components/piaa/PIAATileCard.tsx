import React from 'react';
import { Link } from 'react-router-dom';

interface PIAATileCardProps {
  title: string;
  description: string;
  ctaLabel: string;
  to: string;
  imageUrl?: string;
}

const PIAATileCard: React.FC<PIAATileCardProps> = ({ title, description, ctaLabel, to, imageUrl }) => {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-lg border border-gray-800 bg-gray-900 min-h-[260px] md:min-h-[300px]"
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
        style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : undefined }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/30 group-hover:from-black/95 group-hover:via-black/70" />

      <div className="relative z-10 flex h-full flex-col justify-end p-6">
        <h3 className="text-2xl font-heading font-bold mb-2 text-white">{title}</h3>
        <p className="text-sm md:text-base text-gray-300 mb-4">{description}</p>
        <span className="inline-flex w-fit items-center border border-motorsport-yellow px-3 py-1 text-sm font-semibold text-motorsport-yellow transition-colors group-hover:bg-motorsport-yellow group-hover:text-black">
          {ctaLabel}
        </span>
      </div>
    </Link>
  );
};

export default PIAATileCard;
