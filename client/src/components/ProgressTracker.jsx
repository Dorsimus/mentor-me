import React from 'react'

export default function ProgressTracker({ completed, total }) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  return (
    <div className="my-4 w-full text-center">
      <div className="w-full bg-gray-300 rounded-full h-4">
        <div
          className="bg-brandBlue h-4 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-sm text-gray-700">Completed {completed} of {total} tasks</p>
    </div>
  )
}