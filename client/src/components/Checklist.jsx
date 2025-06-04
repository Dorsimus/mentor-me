import React, { useState } from 'react';

export default function Checklist() {
  const [todayTasks, setTodayTasks] = useState([
    { task: "Complete Benefit Enrollment", done: false },
    { task: "Attend Welcome Meeting", done: false },
    { task: "Sign into Entrata", done: false },
  ]);

  const [upcomingTasks, setUpcomingTasks] = useState([
    { task: "Complete leasing training module", done: false },
    { task: "Tour your community property", done: false },
    { task: "Meet the maintenance team", done: false },
    { task: "Attend leasing meeting", done: false },
    { task: "Review resident satisfaction scores", done: false },
    { task: "Update resident contact list", done: false },
    { task: "Conduct property safety walkthrough", done: false },
    { task: "Set up your work email signature", done: false },
    { task: "Complete emergency procedures training", done: false },
    { task: "Familiarize with local vendors", done: false },
    { task: "Set up access to Redstone intranet", done: false },
    { task: "Meet your Regional Manager", done: false },
    { task: "Review occupancy reports", done: false },
    { task: "Attend software training session", done: false },
    { task: "Prepare leasing packets", done: false },
    { task: "Review previous month's leasing activity", done: false },
    { task: "Learn community amenities", done: false },
  ]);

  const toggleTask = (index, list, setList) => {
    setList(list.map((t, i) => i === index ? {...t, done: !t.done} : t));
  };

  const renderTasks = (tasks, setTasks) => (
    tasks.map((t, index) => (
      <li key={index} className="flex items-center cursor-pointer" onClick={() => toggleTask(index, tasks, setTasks)}>
        <input
          type="checkbox"
          checked={t.done}
          readOnly
          className="mr-3 h-5 w-5 cursor-pointer"
        />
        <span className={`${t.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
          {t.task}
        </span>
      </li>
    ))
  );

  return (
    <div className="mt-8 bg-white shadow-xl rounded-lg p-6">
      
      {/* Today's Tasks */}
      <h2 className="text-xl font-semibold text-blue-700 mb-3 border-b-2 border-blue-200 pb-1">
        Today's Tasks
      </h2>
      <ul className="space-y-2 list-none pl-0 m-0">
        {renderTasks(todayTasks, setTodayTasks)}
      </ul>

      {/* Upcoming Tasks */}
      <h2 className="text-xl font-semibold text-gray-600 mt-8 mb-3 border-b-2 border-gray-200 pb-1">
        Upcoming Tasks
      </h2>
      <ul className="space-y-2 list-none pl-0 m-0 text-gray-600">
        {renderTasks(upcomingTasks, setUpcomingTasks)}
      </ul>
    </div>
  );
}
