import React from 'react';

export default function Personalization() {
  return (
    <div className="mt-8 bg-white shadow-xl rounded-lg p-6">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">Personalization Preferences</h2>
      <form>
        <label className="block mb-4">
          Preferred Learning Style:
          <select className="mt-2 block w-full rounded border-gray-300">
            <option>Visual</option>
            <option>Auditory</option>
            <option>Kinesthetic</option>
          </select>
        </label>
        <label className="block mb-4">
          Favorite Task Types:
          <select className="mt-2 block w-full rounded border-gray-300">
            <option>Interactive activities</option>
            <option>Reading material</option>
            <option>Videos</option>
          </select>
        </label>
        <button type="submit" className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
          Save Preferences
        </button>
      </form>
    </div>
  );
}

