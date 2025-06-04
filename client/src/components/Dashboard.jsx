import React from 'react'
import ProgressBar from './ProgressBar'
import Checklist from './Checklist'
import Chatbot from './Chatbot'

export default function Dashboard() {
  return (
    <div>
      <h1 className='text-3xl font-bold text-brandBlue mb-4'>Welcome to Mentor Me</h1>
      <ProgressBar progress={0.4} />
      <Checklist />
      <Chatbot />
    </div>
  )
}