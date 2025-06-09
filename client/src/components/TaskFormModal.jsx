import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const categories = ['Resource', 'KPI & Task-Based', 'Redstone Moment'];
const formats    = ['Self-Led', 'With Mentor', 'With Regional', 'With Home Base'];
const owners     = ['Self', 'Mentor', 'Leader', 'Home Base'];

export default function TaskFormModal({ mode, initial, onSave, onCancel }) {
  const [roles, setRoles] = useState([]);           // all role options
  const [roleIds, setRoleIds] = useState([]);       // selected role IDs

  const [form, setForm] = useState(
    initial ?? {
      title: '',
      week_num: 1,
      category: categories[0],
      format: formats[0],
      assigned_to: owners[0],
      resource_url: '',
    }
  );

  /* fetch roles once */
  useEffect(() => {
    (async () => {
      const list = await fetch('/api/roles').then(r => r.json());
      setRoles(list);
      if (mode === 'edit' && initial.roles !== 'Global') {
        // convert role names back to IDs
        const names = initial.roles.split(', ');
        setRoleIds(list.filter(r => names.includes(r.name)).map(r => r.id));
      }
    })();
  }, [mode, initial]);

  const toggleRole = id =>
    setRoleIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  /* submit handler */
  const submit = async e => {
    e.preventDefault();
    const body = { ...form, week_num: Number(form.week_num) };

    if (mode === 'add') {
      /* create task */
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) return onSave(null, 'create-fail');
      const { task_id } = await res.json();

      /* map roles */
      if (roleIds.length) {
        await fetch('/api/role_tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_id, role_ids: roleIds }),
        });
      }
      onSave({ id: task_id, ...body, roles: roleIds.length ? roles.filter(r => roleIds.includes(r.id)).map(r => r.name).join(', ') : 'Global' });
    } else {
      /* edit */
      const res = await fetch(`/api/tasks/${initial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) return onSave(null, 'update-fail');
      onSave({ id: initial.id, ...body, roles: initial.roles });
    }
  };

  /* ── Modal markup ───────────────────────── */
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="w-full max-w-lg bg-white rounded shadow-lg p-6 relative">
        <button onClick={onCancel} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-4">
          {mode === 'add' ? 'Add New Task' : 'Edit Task'}
        </h2>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium">Week #</label>
              <input
                type="number"
                min={1}
                className="w-full border rounded px-2 py-1"
                value={form.week_num}
                onChange={e => setForm({ ...form, week_num: e.target.value })}
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">Category</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium">Format</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={form.format}
                onChange={e => setForm({ ...form, format: e.target.value })}
              >
                {formats.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">Owner</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={form.assigned_to}
                onChange={e => setForm({ ...form, assigned_to: e.target.value })}
              >
                {owners.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Resource Link (URL)</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.resource_url}
              onChange={e => setForm({ ...form, resource_url: e.target.value })}
            />
          </div>

          {mode === 'add' && (
            <div>
              <label className="block text-sm font-medium mb-1">Assign to Roles</label>
              <div className="flex flex-wrap gap-4 max-h-40 overflow-y-auto border p-2 rounded">
                {roles.map(r => (
                  <label key={r.id} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={roleIds.includes(r.id)}
                      onChange={() => toggleRole(r.id)}
                    />
                    {r.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-1 rounded border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
