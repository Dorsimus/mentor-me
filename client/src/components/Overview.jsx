import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';

const BLUE  = '#3b82f6';
const GRAY  = '#d1d5db';
const GREEN = '#16a34a';

export default function Overview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/overview').then(r => r.json()).then(setData);
  }, []);

  if (!data) {
    return <p className="p-6">Loading…</p>;
  }

  /* KPI cards */
  const pct = data.task_count
    ? Math.round((data.comp_count / data.task_count) * 100)
    : 0;

  /* donut data */
  const donutData = [
    { name: 'Done',       value: data.comp_count, fill: BLUE },
    { name: 'Remaining', value: data.task_count - data.comp_count, fill: GRAY },
  ];

  return (
    <div className="space-y-8">
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard label="Users"    value={data.user_count}/>
        <KpiCard label="Tasks"    value={data.task_count}/>
        <KpiCard label="Completed" value={`${pct}%`}/>
      </div>

      {/* donut + role bar side-by-side */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* donut */}
        <div className="flex-1 flex flex-col items-center">
          <PieChart width={220} height={220}>
            <Pie
              data={donutData}
              dataKey="value"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
            >
              {donutData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
            </Pie>
            <text
              x="50%" y="50%"
              textAnchor="middle" dominantBaseline="middle"
              className="text-2xl font-semibold fill-gray-800"
            >
              {pct}%
            </text>
          </PieChart>
          <p className="text-gray-600 mt-2">Overall completion</p>
        </div>

        {/* role stacked bar */}
        <div className="flex-1">
          <h3 className="font-medium mb-2">Completion by role</h3>
          <BarChart width={400} height={240} data={data.role_stats}>
            <XAxis dataKey="role" tick={{ fontSize: 11 }}/>
            <YAxis hide/>
            <Bar dataKey="total" stackId="a" fill={GRAY}/>
            <Bar dataKey="done"  stackId="a" fill={GREEN}/>
            <Tooltip/>
            <Legend/>
          </BarChart>
        </div>
      </div>

      {/* week progress */}
      <div>
        <h3 className="font-medium mb-2">Completion by week</h3>
        <BarChart width={600} height={250} data={data.week_stats}>
          <XAxis dataKey="week_num" tick={{ fontSize: 11 }} label={{ value:'Week', position:'insideBottom', dy:7 }}/>
          <YAxis hide/>
          <Bar dataKey="total" stackId="b" fill={GRAY}/>
          <Bar dataKey="done"  stackId="b" fill={BLUE}/>
          <Tooltip/>
        </BarChart>
      </div>
    </div>
  );
}

/* small reusable KPI card */
function KpiCard({ label, value }) {
  return (
    <div className="p-4 bg-gray-50 border rounded text-center shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-semibold text-gray-800">{value}</p>
    </div>
  );
}
