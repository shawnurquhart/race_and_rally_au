import React from 'react';
import BrandPage from './BrandPage';

const PIAAPage: React.FC = () => {
  const piaaFeatures = [
    'Advanced LED Technology for maximum visibility',
    'Rally-proven durability in extreme conditions',
    'Superior light output with precise beam patterns',
    'Professional motorsport heritage and validation',
    'Waterproof and dustproof construction',
    'Easy installation with professional-grade mounting systems'
  ];

  const piaaDescription = "PIAA is world-renowned for premium lighting solutions in motorsport. With decades of experience in professional racing, PIAA's advanced lighting technology delivers exceptional performance in the most demanding conditions, from night rallies to off-road adventures. As an official partner of Race & Rally Australia, PIAA represents the gold standard in motorsport lighting.";

  return (
    <BrandPage
      brandName="PIAA"
      brandDescription={piaaDescription}
      features={piaaFeatures}
      isPIAA={true}
    />
  );
};

export default PIAAPage;
