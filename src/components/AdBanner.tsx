import React from 'react';

interface AdBannerProps {
  size: 'leaderboard' | 'mobile-banner' | 'large-banner';
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ size, className = '' }) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'leaderboard':
        return 'w-full max-w-[728px] h-[90px] hidden md:block';
      case 'mobile-banner':
        return 'w-full max-w-[320px] h-[50px] block md:hidden';
      case 'large-banner':
        return 'w-full max-w-[970px] h-[90px]';
      default:
        return 'w-full h-[90px]';
    }
  };

  return (
    <div className={`mx-auto ${className}`}>
      <div className={`${getSizeClasses()} bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-gray-500 text-sm font-medium">Advertisement</p>
          <p className="text-gray-400 text-xs mt-1">
            {size === 'leaderboard' && '728 x 90'}
            {size === 'mobile-banner' && '320 x 50'}
            {size === 'large-banner' && '970 x 90'}
          </p>
        </div>
      </div>
    </div>
  );
};