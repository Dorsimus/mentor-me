import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

/* fixed lists (updated labels) */
const weeks      = Array.from({ length: 12 }, (_, i) => i + 1);
const categories = ['Resource', 'KPI & Task-Based', 'Redstone Moment'];
const formats    = ['Self-Led', 'With Mentor', 'With Regional', 'With Home Base'];
const assignees  = ['Self', 'Mentor', 'Leader', 'Home Base'];

export default function Admin() {
  const [roles, setRoles] = useState([]);

  const [form, setForm] = useState({
    title: '',
    week_num: '',
    category: '',
    format: '',
    assigned_to: '',
    resource_url: '',
  });
  const [selected, setSelected] = useState(new Set());

  /* fetch roles */
  useEffect(() => {
    fetch('/api/roles')
      .then(r => r.json())
      .then(setRoles)
      .catch(() => toast.error('Failed to load roles'));
  }, []);

  const handle = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const toggleRole = id => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const submit = async e => {
    e.preventDefault();
    try {
      const payload = { ...form, week_num: Number(form.week_num) };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const { task_id } = await res.json();

      await fetch('/api/role_tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id,
          role_ids: Array.from(selected),
        }),
      });

      toast.success('Task created');
      setForm({ ...form, title: '', resource_url: '', week_num: '', category: '', format: '', assigned_to: '' });
      setSelected(new Set());
    } catch {
      toast.error('Save failed');
    }
  };

  const missing =
    !form.title || !form.week_num || !form.category || !form.format || !form.assigned_to;

  return (
    <div className="max-w-xl mx-auto mt-8 p-6 bg-white shadow rounded space-y-4">
      <h1 className="text-2xl font-bold">Add New Task</h1>

      <form onSubmit={submit} className="space-y-4">
        <input
          name="title"
          value={form.title}
          onChange={handle}
          placeholder="Task title"
          className="w-full border px-3 py-2 rounded"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <select name="week_num" value={form.week_num} onChange={handle} className="border p-2 rounded">
            <option value="" disabled hidden>Assign to week…</option>
            {weeks.map(w => <option key={w} value={w}>Week {w}</option>)}
          </select>

          <select name="category" value={form.category} onChange={handle} className="border p-2 rounded">
            <option value="" disabled hidden>Task type</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>

          <select name="format" value={form.format} onChange={handle} className="border p-2 rounded">
            <option value="" disabled hidden>Who with?</option>
            {formats.map(f => <option key={f}>{f}</option>)}
          </select>

          <select name="assigned_to" value={form.assigned_to} onChange={handle} className="border p-2 rounded">
            <option value="" disabled hidden>Owner</option>
            {assignees.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>

        <input
          name="resource_url"
          value={form.resource_url}
          onChange={handle}
          placeholder="Resource link (optional)"
          className="w-full border px-3 py-2 rounded"
        />

        {/* roles two-column grid */}
        <div>
          <p className="font-semibold mb-2">Assign to roles:</p>
          <div className="grid grid-cols-2 gap-2">
            {roles.map(r => (
              <label key={r.id} className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={selected.has(r.id)}
                  onChange={() => toggleRole(r.id)}
                />
                {r.name}
              </label>
            ))}
          </div>
        </div>

        <button
          disabled={missing}
          className={clsx(
            'bg-blue-600 text-white px-4 py-2 rounded transition',
            missing && 'opacity-50 cursor-not-allowed'
          )}
        >
          Save Task
        </button>
      </form>
    </div>
  );
}
