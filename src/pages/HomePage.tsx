import React from 'react'; 
import { 
  FileImage, 
  Zap, 
  FileText, 
  ArrowRight
} from 'lucide-react';
import { FeatureCard } from '../components/FeatureCard';
import { PrivacyNotice } from '../components/PrivacyNotice';
import { Helmet } from 'react-helmet';

interface HomePageProps {
  onNavigateToConverter: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigateToConverter }) => {
  const features = [
    {
      icon: FileImage,
      title: 'Image Conversion',
      description: 'Convert between JPEG and PNG formats with precision and speed.',
      features: ['JPEG ↔ PNG conversion', 'Batch processing', 'Quality preservation', 'Metadata retention'],
      gradient: 'from-blue-500 to-blue-700'
    },
    {
      icon: FileText,
      title: 'PDF Generation',
      description: 'Transform your images into professional PDF documents.',
      features: ['Image to PDF', 'Multiple images per PDF', 'Custom page sizes', 'High-quality output'],
      gradient: 'from-purple-500 to-purple-700'
    },
    {
      icon: Zap,
      title: 'File Optimization',
      description: 'Compress and optimize files without compromising quality.',
      features: ['Smart compression', 'Quality control', 'Size reduction', 'Lossless options'],
      gradient: 'from-green-500 to-green-700'
    }
  ];

  return (
    <>
      <Helmet>
        <title>FileEase - Professional File Conversion & Optimization</title>
        <meta name="description" content="Convert and optimize your files including JPEG, PNG, and PDF with FileEase. Fast, secure, and browser-based." />
        <meta property="og:title" content="FileEase - File Conversion & Optimization" />
        <meta property="og:description" content="Convert and optimize your files including JPEG, PNG, and PDF formats with ease using FileEase." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://fileease-iota.vercel.app" />
        <meta property="og:image" content="https://fileease-iota.vercel.app/og-image.png" />
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Convert & Optimize with
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  FileEase
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                FileEase is your professional file conversion and optimization tool. 
                Convert between JPEG, PNG, and PDF formats with advanced compression and quality control — all securely in your browser.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <button
                  onClick={onNavigateToConverter}
                  className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Start Converting 
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 transform translate-x-1/2 translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl" />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Main Content */}
              <div className="flex-1">
                <div className="text-center mb-16">
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                    Welcome to FileEase
                  </h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Whether you're converting formats, optimizing file sizes, or creating PDFs, 
                    FileEase gives you the tools you need for professional results.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {features.map((feature, index) => (
                    <FeatureCard
                      key={index}
                      icon={feature.icon}
                      title={feature.title}
                      description={feature.description}
                      features={feature.features}
                      onClick={onNavigateToConverter}
                      gradient={feature.gradient}
                    />
                  ))}
                </div>
              </div>

              {/* 🔖 Sidebar Ad Removed */}
            </div>
          </div>
        </section>

        {/* 🔖 Middle Banner Ad Removed */}

        <PrivacyNotice />

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Get Started with FileEase?
            </h2>
            <p className="text-xl text-white text-opacity-90 mb-8">
              Join thousands of users who trust FileEase for their file conversion needs.
            </p>
            <button
              onClick={onNavigateToConverter}
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-xl"
            >
              Start Converting with FileEase
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </section>
      </div>
    </>
  );
};
