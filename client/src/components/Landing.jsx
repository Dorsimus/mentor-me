import React from 'react';
import { useNavigate } from 'react-router-dom';
import mentorIcon from '../assets/mentor-icon.png';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-700 to-red-500 flex items-center justify-center">
      <div className="bg-white bg-opacity-90 rounded-lg shadow-2xl p-10 max-w-xl mx-auto text-center animate-fade-in">
        <img src={mentorIcon} alt="Mentor Icon" className="mx-auto mb-6 h-20 animate-bounce" />
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Welcome to Your Redstone Mentor!
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          Your ultimate onboarding experience awaits. 
        </p>
        <button
          onClick={() => navigate('/checklist')}
          className="bg-blue-600 text-white px-6 py-2 rounded-full shadow hover:bg-blue-700 transition duration-300 transform hover:scale-105"
        >
          Get Started Now
        </button>
      </div>
    </div>
  );
}
