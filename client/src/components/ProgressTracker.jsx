import React from 'react'

export default function ProgressBar({ progress }) {
  return (
    <div className="w-full bg-gray-300 rounded-full h-4 mb-4">
      <div
        className="bg-brandRed h-4 rounded-full"
        style={{ width: `${Math.round(progress * 100)}%` }}
      />
    </div>
  )
}