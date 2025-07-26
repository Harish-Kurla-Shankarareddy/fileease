import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  onClick: () => void;
  gradient: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  features,
  onClick,
  gradient
}) => {
  return (
    <div 
      className={`
        relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 
        cursor-pointer transform hover:-translate-y-1 group
        bg-gradient-to-br ${gradient}
      `}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
      
      <div className="relative p-8">
        <div className="flex items-center mb-4">
          <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
            <Icon className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-white text-opacity-90 mb-6 leading-relaxed">{description}</p>
        
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-white text-opacity-80 text-sm">
              <div className="w-1.5 h-1.5 bg-white bg-opacity-60 rounded-full mr-3" />
              {feature}
            </li>
          ))}
        </ul>
        
        <div className="mt-8">
          <div className="inline-flex items-center text-white font-medium group-hover:underline">
            Get Started
            <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};