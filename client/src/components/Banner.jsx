import React from 'react';
import logo from '../assets/Redstone_Logo_RGB_CharcoalMix.png';   // ← forward-slash

export default function Banner() {
  return (
    <div className="fixed inset-x-0 top-0 h-12 bg-white flex items-center gap-2 px-4 border-b border-gray-200 z-50">
      <img src={logo} alt="Redstone Logo" className="h-8 w-auto" />
      <span className="align-bottom-lg font-semibold text-gray-800">
         Onboarding
      </span>
    </div>
  );
}
