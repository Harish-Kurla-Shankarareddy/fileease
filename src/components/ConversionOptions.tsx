import React from 'react';
import { Settings, Zap, FileImage, FileText, FileDown } from 'lucide-react';
import { ConversionType } from '../types';

interface ConversionOptionsProps {
  conversionType: ConversionType;
  quality: number;
  onQualityChange: (quality: number) => void;
  onConversionTypeChange: (type: ConversionType) => void;
}

export const ConversionOptions: React.FC<ConversionOptionsProps> = ({
  conversionType,
  quality,
  onQualityChange,
  onConversionTypeChange
}) => {
  const conversionTypes = [
    { value: 'jpeg-to-png', label: 'JPEG → PNG', icon: FileImage, group: 'image' },
    { value: 'png-to-jpeg', label: 'PNG → JPEG', icon: FileImage, group: 'image' },
    { value: 'jpeg-to-pdf', label: 'JPEG → PDF', icon: FileText, group: 'image-to-pdf' },
    { value: 'png-to-pdf', label: 'PNG → PDF', icon: FileText, group: 'image-to-pdf' },
    { value: 'optimize-jpeg', label: 'Optimize JPEG', icon: Zap, group: 'optimize' },
    { value: 'optimize-png', label: 'Optimize PNG', icon: Zap, group: 'optimize' },
    { value: 'pdf-to-jpeg', label: 'PDF → JPEG', icon: FileDown, group: 'pdf' },
    { value: 'pdf-to-png', label: 'PDF → PNG', icon: FileDown, group: 'pdf' },
    { value: 'pdf-to-word', label: 'PDF → Word', icon: FileText, group: 'pdf' },
  ];

  const qualityOptions = [
    { value: 0.25, label: '25% - Smallest' },
    { value: 0.5, label: '50% - Small' },
    { value: 0.75, label: '75% - Good' },
    { value: 0.9, label: '90% - High Quality' },
  ];

  // Group conversion types
  const groupedConversions = {
    image: { label: 'Image Conversions', types: conversionTypes.filter(t => t.group === 'image') },
    'image-to-pdf': { label: 'Image to PDF', types: conversionTypes.filter(t => t.group === 'image-to-pdf') },
    optimize: { label: 'Optimization', types: conversionTypes.filter(t => t.group === 'optimize') },
    pdf: { label: 'PDF Conversions', types: conversionTypes.filter(t => t.group === 'pdf') },
  };

  // Show quality settings only for relevant conversions
  const showQualitySettings = conversionType.includes('jpeg') || 
                             conversionType.includes('png') || 
                             conversionType === 'optimize-jpeg' || 
                             conversionType === 'optimize-png';

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center mb-6">
        <Settings className="h-6 w-6 text-blue-600 mr-2" />
        <h3 className="text-xl font-semibold text-gray-800">Conversion Options</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Conversion Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Conversion Type
          </label>
          
          <div className="space-y-4">
            {Object.entries(groupedConversions).map(([groupKey, group]) => (
              <div key={groupKey}>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {group.label}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {group.types.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => onConversionTypeChange(type.value as ConversionType)}
                        className={`
                          flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200
                          ${conversionType === type.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }
                        `}
                      >
                        <IconComponent className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Settings or PDF Conversion Info */}
        <div>
          {showQualitySettings ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quality Setting
              </label>
              <div className="space-y-2">
                {qualityOptions.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="quality"
                      value={option.value}
                      checked={quality === option.value}
                      onChange={(e) => onQualityChange(parseFloat(e.target.value))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Quality: {Math.round(quality * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) => onQualityChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">
                {conversionType === 'pdf-to-word' 
                  ? 'PDF to Word Conversion'
                  : 'PDF to Image Conversion'
                }
              </h4>
              <p className="text-sm text-blue-700">
                {conversionType === 'pdf-to-word' 
                  ? 'PDF will be converted to Word document with text extraction. Multi-page PDFs will be combined into a single document.'
                  : 'Multi-page PDFs will be converted to a ZIP file containing all pages as images.'
                }
              </p>
              {conversionType !== 'pdf-to-word' && (
                <p className="text-xs text-blue-600 mt-2">
                  Note: Quality settings don't apply to PDF conversions
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};