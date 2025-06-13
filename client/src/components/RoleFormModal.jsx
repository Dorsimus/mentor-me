import React, { useState } from 'react';
import { X } from 'lucide-react';

/* For both “Add” and “Rename” */
export default function RoleFormModal({ mode, initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '');

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    const url    = mode === 'add' ? '/api/roles' : `/api/roles/${initial.id}`;
    const method = mode === 'add' ? 'POST'      : 'PUT';
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type':'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) return onSave(null);
    const data = mode === 'add' ? await res.json() : { id: initial.id, name };
    onSave(data);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="w-full max-w-sm bg-white p-6 rounded shadow relative">
        <button onClick={onCancel} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X size={20}/>
        </button>
        <h2 className="text-xl font-semibold mb-4">
          {mode === 'add' ? 'Add Role' : 'Rename Role'}
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <input
            placeholder="Role name"
            className="w-full border rounded px-3 py-2"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="border px-4 py-1 rounded">Cancel</button>
            <button type="submit" className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
