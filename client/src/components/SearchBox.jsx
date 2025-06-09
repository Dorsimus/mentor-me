import React from 'react';

export default function SearchBox({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring
                 focus:ring-blue-300 w-48 placeholder:text-gray-400"
    />
  );
}
