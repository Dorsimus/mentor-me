import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Pencil, Trash2, PlusCircle, BarChartBig } from 'lucide-react';
import UserFormModal from './UserFormModal';
import UserProgressModal from './UserProgressModal';

export default function Users() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | {...} | {mode:'progress',user}

  /* fetch users */
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => { setRows(d); setLoading(false); });
  }, []);

  /* delete */
  const remove = async id => {
    if (!window.confirm('Delete this user?')) return;
    const ok = await fetch(`/api/users/${id}`, { method: 'DELETE' }).then(r => r.ok);
    if (ok) {
      setRows(rows.filter(r => r.id !== id));
      toast.success('User deleted', { duration: 1500, position: 'top-center' });
    } else toast.error('Delete failed');
  };

  /* modal save */
  const handleSave = (user) => {
    setModal(null);
    if (!user) { toast.error('Save failed'); return; }
    if (modal.mode === 'add') setRows([...rows, user]);
    else setRows(rows.map(r => (r.id === user.id ? user : r)));
  };

  if (loading) return <p className="p-6">Loading…</p>;

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white shadow rounded relative">
      <h1 className="text-2xl font-bold mb-4">Users</h1>

      <button
        onClick={() => setModal({ mode: 'add' })}
        className="absolute top-6 right-6 flex items-center gap-1 text-blue-600 hover:text-blue-800"
      >
        <PlusCircle size={18}/> Add User
      </button>

      <table className="w-full border text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 border">Name</th>
            <th className="px-3 py-2 border">Email</th>
            <th className="px-3 py-2 border">Role</th>
            <th className="px-3 py-2 border text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="odd:bg-gray-50">
              <td className="px-3 py-2 border">{r.name}</td>
              <td className="px-3 py-2 border">{r.email}</td>
              <td className="px-3 py-2 border">{r.role ?? '—'}</td>
              <td className="px-3 py-2 border text-center flex justify-center gap-3">
                <Pencil size={16} className="text-blue-600 cursor-pointer hover:text-blue-800"
                        onClick={() => setModal({ mode: 'edit', row: r })}/>
                <Trash2 size={16} className="text-red-600 cursor-pointer hover:text-red-800"
                        onClick={() => remove(r.id)}/>
                <BarChartBig
                    size={16}
                    className="text-green-600 cursor-pointer hover:text-green-800"
                    onClick={() => setModal({ mode: 'progress', user: r })}
  />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
       +  modal.mode === 'add' || modal.mode === 'edit' ? (
    <UserFormModal
      mode={modal.mode}
      initial={modal.row}
      onSave={handleSave}
      onCancel={() => setModal(null)}
    />
  ) : (
    <UserProgressModal
      user={modal.user}
      onClose={() => setModal(null)}
    />
  )
      )}
    </div>
  );
}
