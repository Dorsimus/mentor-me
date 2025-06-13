import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Pencil, Trash2, ShieldCheck } from 'lucide-react';
import UserFormModal from './UserFormModal';

export default function DashboardUsers() {
  const [rows, setRows]   = useState([]);
  const [load, setLoad]   = useState(true);
  const [modal, setModal] = useState(null); // null | {mode:'add'} | {mode:'edit',row}

  /* fetch users once */
  useEffect(() => {
    fetch('/api/users/all', {
      headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(data => { setRows(Array.isArray(data)?data:[]); setLoad(false); })
      .catch(err => { console.error(err); setLoad(false); });
  }, []);

  /* delete */
  const remove = async id => {
    if (!window.confirm('Delete this user?')) return;
    const ok = await fetch(`/api/users/${id}`, {
      method:'DELETE',
      headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` },
    }).then(r=>r.ok);
    if (ok) setRows(rows.filter(r=>r.id!==id));
    else toast.error('Delete failed');
  };

  /* save from modal */
  const handleSave = (row) => {
    setModal(null);
    if (!row) { toast.error('Save failed'); return; }
    if (modal.mode==='add') setRows([...rows, row]);
    else setRows(rows.map(r => (r.id===row.id ? row : r)));
  };

  if (load) return <p className="p-6">Loading…</p>;

  return (
    <div className="relative">
      <button
        onClick={()=>setModal({mode:'add'})}
        className="mb-4 flex items-center gap-1 text-blue-600 hover:text-blue-800"
      >
        + Add User
      </button>

      <table className="w-full border text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 border">ID</th>
            <th className="px-3 py-2 border">Name</th>
            <th className="px-3 py-2 border">Email</th>
            <th className="px-3 py-2 border">Role</th>
            <th className="px-3 py-2 border text-center">Admin?</th>
            <th className="px-3 py-2 border text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.id} className="odd:bg-gray-50">
              <td className="px-3 py-2 border text-center">{r.id}</td>
              <td className="px-3 py-2 border">{r.name}</td>
              <td className="px-3 py-2 border">{r.email}</td>
              <td className="px-3 py-2 border">{r.role_name}</td>
              <td className="px-3 py-2 border text-center">
                {r.is_admin && <ShieldCheck size={16} className="text-blue-600 inline"/>}
              </td>
              <td className="px-3 py-2 border text-center flex justify-center gap-3">
                <Pencil size={16} className="text-blue-600 cursor-pointer hover:text-blue-800"
                        onClick={()=>setModal({mode:'edit',row:r})}/>
                <Trash2 size={16} className="text-red-600 cursor-pointer hover:text-red-800"
                        onClick={()=>remove(r.id)}/>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <UserFormModal
          mode={modal.mode}
          initial={modal.row}
          onSave={handleSave}
          onCancel={()=>setModal(null)}
        />
      )}
    </div>
  );
}
