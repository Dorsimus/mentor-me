import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import { toast } from 'react-hot-toast';

export default function MyChecklists() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/user_checklists', {
      headers: { Authorization:`Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setRows)
      .catch(() => toast.error('Load failed'));
  }, []);

  if (rows === null) return <p className="p-6">Loading…</p>;
  if (!rows.length)  return <p className="p-6">You have no checklists yet.</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">My Checklists</h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(cl => (
          <ChecklistCard key={cl.id} cl={cl} />
        ))}
      </div>
    </div>
  );
}

/* mini card */
function ChecklistCard({ cl }) {
  return (
    <Link
      to={`/checklists/${cl.id}`}
      className="block border rounded-lg p-4 shadow hover:shadow-md transition"
    >
      <h3 className="font-medium mb-2">{cl.name}</h3>
      <ChecklistCardProgress checklistId={cl.id} />
      {cl.due_date && (
        <p className="text-xs text-gray-500 mt-2">Due {new Date(cl.due_date).toLocaleDateString()}</p>
      )}
    </Link>
  );
}

/* fetch lightweight progress numbers for card */
function ChecklistCardProgress({ checklistId }) {
  const [pct, setPct] = useState(null);

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('token');
    fetch(`/api/user_checklists/${checklistId}/tasks`, {
      headers:{ Authorization:`Bearer ${token}` },
    })
      .then(r => r.json())
      .then(tasks => {
        if (!mounted) return;
        const done  = tasks.filter(t => t.completed).length;
        const total = tasks.length;
        setPct(total ? Math.round((done/total)*100) : 0);
      });
    return () => { mounted = false; };
  }, [checklistId]);

  if (pct === null) return <p className="text-xs">Loading…</p>;

  return (
    <>
      <ProgressBar completed={pct} total={100} />
      <p className="text-xs mt-1">{pct}% complete</p>
    </>
  );
}
