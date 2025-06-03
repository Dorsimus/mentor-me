import React from 'react';
import Checklist from './Checklist';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0127a2] to-[#ff3443] flex items-center justify-center">
      <div className="bg-white bg-opacity-90 rounded-lg shadow-2xl p-10 max-w-xl mx-auto text-center animate-fade-in">
       <img 
        src="/Redstone_Logo_RGB_WhiteMix.png" 
        alt="Mentor-Me Logo"
        style={{ height: '100px', width: 'auto', maxWidth: '100%' }}
        className="mx-auto mb-6 animate-bounce"
       />
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Welcome your Redstone Onboarding Mentor!
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          The ultimate onboarding experience awaits! Time to start your journey!
        </p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-full shadow hover:bg-blue-700 transition duration-300 transform hover:scale-105">
          Let's go!
        </button>
        {/* Explicitly render your Checklist here */}
        <div className="mt-8">
          <Checklist />
        </div>
      </div>
    </div>
  );
}

export default App;

