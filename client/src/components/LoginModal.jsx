import React from 'react';
import { X } from 'lucide-react';
import Login from './Login';

export default function LoginModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]"
      onClick={onClose}                             /* click backdrop to close */
    >
      {/* stop propagation inside the card */}
      <div onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 text-white hover:text-gray-300"
        >
          <X size={24} />
        </button>

        {/* reuse the <Login> form body, but override its full-screen classes */}
        <div className="bg-white p-6 rounded shadow-lg w-[340px]">
          <Login compact />
        </div>
      </div>
    </div>
  );
}
