import React from 'react';

interface AdSidebarProps {
  className?: string;
}

export const AdSidebar: React.FC<AdSidebarProps> = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Medium Rectangle Ad */}
      <div className="w-full max-w-[300px]">
        <div className="w-[300px] h-[250px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-sm font-medium">Advertisement</p>
            <p className="text-gray-400 text-xs mt-1">300 x 250</p>
          </div>
        </div>
      </div>

      {/* Wide Skyscraper Ad */}
      <div className="w-full max-w-[160px] hidden xl:block">
        <div className="w-[160px] h-[600px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-sm font-medium">Advertisement</p>
            <p className="text-gray-400 text-xs mt-1">160 x 600</p>
          </div>
        </div>
      </div>

      {/* Square Ad */}
      <div className="w-full max-w-[250px]">
        <div className="w-[250px] h-[250px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-sm font-medium">Advertisement</p>
            <p className="text-gray-400 text-xs mt-1">250 x 250</p>
          </div>
        </div>
      </div>
    </div>
  );
};