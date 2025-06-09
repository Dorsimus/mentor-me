import React, { useState } from 'react';
import DashboardTasks from './DashboardTasks';
import DashboardUsers from './DashboardUsers';

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'tasks',    label: 'All Tasks' },
  { key: 'users',    label: 'Users' },
];

export default function Dashboard() {
  const [tab, setTab] = useState('tasks');   // default Tasks

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      {/* tab bar */}
      <div className="flex gap-4 border-b mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-2 -mb-px border-b-2 ${
              tab === t.key
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* tab content */}
      {tab === 'overview' && (
        <div className="p-6 text-gray-600">
          <p className="mb-2">Overview coming soon – aggregate charts, role metrics, and more.</p>
        </div>
      )}

      {tab === 'tasks' && <DashboardTasks />}

      {tab === 'users' && <DashboardUsers />}
    </div>
  );
}
