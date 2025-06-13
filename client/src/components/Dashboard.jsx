import React, { useState, useContext } from 'react';
import Overview        from './Overview';
import DashboardTasks  from './DashboardTasks';
import DashboardUsers  from './DashboardUsers';
import DashboardRoles  from './DashboardRoles';
import { AuthContext } from '../AuthContext';

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'tasks',    label: 'All Tasks' },
  { key: 'users',    label: 'Users' },
  { key: 'roles',    label: 'Roles' },
];

export default function Dashboard() {
  const [tab, setTab] = useState('overview');
  const { user }      = useContext(AuthContext);

  if (!user?.is_admin) return <p className="p-6 text-red-600">Unauthorized</p>;

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

      {/* content */}
      {tab === 'overview' && <Overview />}
      {tab === 'tasks'    && <DashboardTasks />}
      {tab === 'users'    && <DashboardUsers />}
      {tab === 'roles'    && <DashboardRoles />}
    </div>
  );
}
