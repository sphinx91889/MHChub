import React from 'react';
import { Construction } from 'lucide-react';

export default function Settings() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Construction className="w-16 h-16 text-gray-400 mb-4" />
      <h2 className="text-2xl font-bold text-gray-700 mb-2">Coming Soon</h2>
      <p className="text-gray-500">The Settings page is currently under development.</p>
    </div>
  );
}