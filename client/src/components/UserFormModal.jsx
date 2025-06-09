import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function UserFormModal({ mode, initial, onSave, onCancel }) {
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(
    initial ?? { name: '', email: '', role_id: null }
  );

  useEffect(() => {
    fetch('/api/roles').then(r => r.json()).then(setRoles);
  }, []);

  const submit = async e => {
    e.preventDefault();
    const body = { ...form, role_id: form.role_id || null };
    const url  = mode === 'add' ? '/api/users' : `/api/users/${initial.id}`;
    const res  = await fetch(url, {
      method: mode === 'add' ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return onSave(null);
    const data = mode === 'add' ? await res.json() : { id: initial.id, ...body, role: roles.find(r=>r.id===body.role_id)?.name || null };
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-white rounded shadow p-6 relative">
        <button onClick={onCancel} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X size={20}/>
        </button>

        <h2 className="text-xl font-semibold mb-4">
          {mode === 'add' ? 'Add New User' : 'Edit User'}
        </h2>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              className="w-full border rounded px-2 py-1"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Role</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={form.role_id ?? ''}
              onChange={e => setForm({ ...form, role_id: e.target.value || null })}
            >
              <option value="">— None / Global —</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-1 border rounded">Cancel</button>
            <button type="submit" className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
