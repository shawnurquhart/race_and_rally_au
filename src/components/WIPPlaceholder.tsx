import React from 'react';
import { Wrench, Clock, Shield } from 'lucide-react';

interface WIPPlaceholderProps {
  title: string;
  description: string;
  showIcon?: boolean;
  className?: string;
}

const WIPPlaceholder: React.FC<WIPPlaceholderProps> = ({
  title,
  description,
  showIcon = true,
  className = '',
}) => {
  return (
    <div className={`bg-gray-900 border border-gray-800 p-8 md:p-12 ${className}`}>
      <div className="max-w-3xl mx-auto text-center">
        {showIcon && (
          <div className="flex justify-center mb-6">
            <div className="bg-gray-800 p-4 rounded-full">
              <Wrench size={48} className="text-motorsport-yellow" />
            </div>
          </div>
        )}
        
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">{title}</h2>
        
        <div className="flex items-center justify-center space-x-4 mb-6 text-gray-400">
          <Clock size={20} />
          <span className="text-sm font-medium">WORK IN PROGRESS</span>
          <Shield size={20} />
        </div>
        
        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
          {description}
        </p>
        
        <div className="bg-black border border-gray-800 p-6">
          <p className="text-gray-400 mb-4">
            This section is currently being prepared with professional motorsport-grade content.
            We're ensuring every detail meets our standards for performance, safety, and reliability.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Clock size={14} />
            <span>Expected completion: Q2 2025</span>
          </div>
        </div>
        
        {/* TODO: Stage 2 - Replace with actual content */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Stage 1: Brand & Structure • Stage 2: Commerce & Catalog</p>
        </div>
      </div>
    </div>
  );
};

export default WIPPlaceholder;
