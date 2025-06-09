import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts';

const COLORS = ['#3b82f6', '#d1d5db'];            // blue, gray

export default function UserProgressModal({ user, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${user.id}/progress_summary`)
      .then(r => r.json())
      .then(setData);
  }, [user.id]);

  if (!data) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="p-8 bg-white rounded shadow">Loading…</div>
      </div>
    );
  }

  const { total_tasks, completed_tasks, weeks, tasks } = data;
  const donutData = [
    { name: 'Done', value: completed_tasks },
    { name: 'Remaining', value: total_tasks - completed_tasks },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="w-full max-w-3xl bg-white rounded shadow-lg p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X size={20}/>
        </button>

        <h2 className="text-xl font-semibold mb-4">
          Progress — {user.name}
        </h2>

        {/* donut & week bars */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* donut */}
          <div className="flex-1 flex flex-col items-center">
            <PieChart width={180} height={180}>
              <Pie
                data={donutData}
                dataKey="value"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {donutData.map((_, i) => <Cell key={i} fill={COLORS[i]}/>)}
              </Pie>
              +  {/* centered percentage */}
                <text
                    x="50%" y="50%"
                    textAnchor="middle" dominantBaseline="middle"
                    className="font-semibold text-xl fill-gray-800"
                >
                    {Math.round((completed_tasks / total_tasks) * 100)}%
                </text>
              <Tooltip/>
            </PieChart>
            <p className="text-center font-medium mt-2">
              {completed_tasks}/{total_tasks} tasks
            </p>
          </div>

          {/* bar chart */}
          <div className="flex-1">
            <BarChart width={320} height={180} data={weeks}>
              <XAxis dataKey="week_num" tick={{ fontSize: 11 }}/>
              <YAxis hide domain={[0, d=>Math.max(d,5)]}/>
              <Bar dataKey="total" stackId="a" fill="#d1d5db"/>
              <Bar dataKey="done"  stackId="a" fill="#3b82f6"/>
              <Tooltip/>
            </BarChart>
          </div>
        </div>

        {/* task list */}
        <div className="max-h-72 overflow-y-auto border rounded">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="px-3 py-1 border">Week</th>
                <th className="px-3 py-1 border text-left">Title</th>
                <th className="px-3 py-1 border">Done</th>
                <th className="px-3 py-1 border">Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id} className="odd:bg-gray-50">
                  <td className="px-3 py-1 border text-center">{t.week_num}</td>
                  <td className="px-3 py-1 border">{t.title}</td>
                  <td className="px-3 py-1 border text-center">
                    {t.completed ? '✓' : ''}
                  </td>
                  <td className="px-3 py-1 border text-center">
                    {t.completed_at ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
