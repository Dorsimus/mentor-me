import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Pencil, Trash2, PlusCircle } from 'lucide-react';
import RoleFormModal from './RoleFormModal';

export default function DashboardRoles() {
  const [rows, setRows]   = useState([]);
  const [loading, setLoad] = useState(true);
  const [modal, setModal] = useState(null); // null | {mode:'add'} | {mode:'edit', row}

  /* fetch roles once */
  useEffect(() => {
    fetch('/api/roles', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(data => { setRows(Array.isArray(data) ? data : []); setLoad(false); })
      .catch(err => { console.error(err); setLoad(false); });
  }, []);

  /* delete role */
  const remove = async id => {
    if (!window.confirm('Delete this role?')) return;
    const ok = await fetch(`/api/roles/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then(r => r.ok);

    if (ok) {
      setRows(rows.filter(r => r.id !== id));
      toast.success('Role deleted');
    } else toast.error('Delete failed');
  };

  /* add / rename save */
  const handleSave = role => {
    setModal(null);
    if (!role) { toast.error('Save failed'); return; }
    if (modal.mode === 'add') setRows([...rows, role]);
    else setRows(rows.map(r => (r.id === role.id ? role : r)));
  };

  if (loading) return <p className="p-6">Loading…</p>;

  return (
    <div className="space-y-4">
      {/* add button (always visible) */}
      <button
        onClick={() => setModal({ mode: 'add' })}
        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
      >
        <PlusCircle size={18}/> Add Role
      </button>

      {/* roles table */}
      <table className="w-full border text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 border">ID</th>
            <th className="px-3 py-2 border text-left">Role Name</th>
            <th className="px-3 py-2 border text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="odd:bg-gray-50">
              <td className="px-3 py-2 border text-center">{r.id}</td>
              <td className="px-3 py-2 border">{r.name}</td>
              <td className="px-3 py-2 border text-center flex justify-center gap-3">
                <Pencil size={16} className="text-blue-600 cursor-pointer hover:text-blue-800"
                        onClick={() => setModal({ mode:'edit', row:r })}/>
                <Trash2 size={16} className="text-red-600 cursor-pointer hover:text-red-800"
                        onClick={() => remove(r.id)}/>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <RoleFormModal
          mode={modal.mode}
          initial={modal.row}
          onSave={handleSave}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
