import React from 'react';
import Checklist from './components/Checklist';
import Chatbot from './components/Chatbot';
import ProgressTracker from './components/ProgressTracker';
import Personalization from './components/Personalization';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0127a2] to-[#ff3443] flex flex-col items-center py-10 space-y-6">
      <Chatbot />
      <ProgressTracker />
      <Checklist />
      <Personalization />
    </div>
  );
}

export default App;

