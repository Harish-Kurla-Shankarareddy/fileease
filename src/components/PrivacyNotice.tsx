import React from 'react';
import { Shield, Clock, Trash2, Lock } from 'lucide-react';

export const PrivacyNotice: React.FC = () => {
  return (
    <section className="py-16 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Your Privacy Matters</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We're committed to protecting your data with industry-leading privacy practices 
            and transparent policies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
              <Lock className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Client-Side Processing</h3>
            <p className="text-gray-300 leading-relaxed">
              All conversions happen in your browser. Files never leave your device.
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-xl mb-4">
              <Shield className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-3">No Data Collection</h3>
            <p className="text-gray-300 leading-relaxed">
              We don't track, store, or analyze your files or personal information.
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-xl mb-4">
              <Clock className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Temporary Storage</h3>
            <p className="text-gray-300 leading-relaxed">
              Any temporary files are automatically deleted after 24 hours maximum.
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-xl mb-4">
              <Trash2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Instant Cleanup</h3>
            <p className="text-gray-300 leading-relaxed">
              Delete your files immediately after download with one click.
            </p>
          </div>
        </div>

        <div className="mt-12 bg-gray-800 rounded-xl p-8">
          <h3 className="text-2xl font-bold mb-6">Our Privacy Commitments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-green-400 mb-3">What We Do</h4>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  Process files entirely in your browser
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  Secure HTTPS connections
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  Open source and transparent
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  No user accounts required
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-red-400 mb-3">What We Never Do</h4>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  Store your files on our servers
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  Track your usage or behavior
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  Share data with third parties
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                  Require user accounts or registration
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};