import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  ExternalLink, Pencil, Trash2, ChevronsUpDown, PlusCircle,
} from 'lucide-react';
import TaskFormModal from './TaskFormModal';

/* helper to build dropdowns safely */
const buildOptions = (list, key) =>
  ['All', ...new Set((Array.isArray(list) ? list : [])
    .map(r => r[key]).filter(Boolean))];

export default function DashboardTasks() {
  const [rows, setRows]   = useState([]);
  const [loading, setLoading] = useState(true);

  /* sort + filter state */
  const [sortCol, setSortCol] = useState('week_num');
  const [direction, setDir]   = useState('asc');
  const [filters, setFilter]  = useState({
    week:'All', cat:'All', fmt:'All', own:'All', role:'All', text:'',
  });

  /* modal state */
  const [modal, setModal] = useState(null);

  /* initial fetch */
  useEffect(() => {
    fetch('/api/tasks/all', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(data => {
        console.log('DEBUG typeof', typeof data, Array.isArray(data));
        setRows(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => console.error('fetch error', err));
  }, []);

  /* dropdown options */
  const weekOpts = buildOptions(rows, 'week_num');
  const catOpts  = buildOptions(rows, 'category');
  const fmtOpts  = buildOptions(rows, 'format');
  const ownOpts  = buildOptions(rows, 'assigned_to');
  const roleOpts = [
    'All',
    ...new Set(
      (Array.isArray(rows) ? rows : []).reduce((acc, r) => {
        if (r.roles) acc.push(...r.roles.split(', '));
        return acc;
      }, [])
    ),
  ];

  /* filtered + sorted rows */
  const visible = rows
    .filter(r => filters.week === 'All' || r.week_num    === Number(filters.week))
    .filter(r => filters.cat  === 'All' || r.category    === filters.cat)
    .filter(r => filters.fmt  === 'All' || r.format      === filters.fmt)
    .filter(r => filters.own  === 'All' || r.assigned_to === filters.own)
    .filter(r => filters.role === 'All' || r.roles.split(', ').includes(filters.role))
    .filter(r => r.title.toLowerCase().includes(filters.text.toLowerCase()))
    .sort((a, b) => {
      const d = direction === 'asc' ? 1 : -1;
      return a[sortCol] < b[sortCol] ? -1 * d : a[sortCol] > b[sortCol] ? 1 * d : 0;
    });

  const toggleSort = col => {
    if (col === sortCol) setDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setDir('asc'); }
  };
  const sortIcon = col => (
    <ChevronsUpDown size={14} className={`inline ml-1 ${col === sortCol ? 'text-blue-600' : 'text-gray-300'}`} />
  );

  const remove = async id => {
    if (!window.confirm('Delete this task?')) return;
    const ok = await fetch(`/api/tasks/${id}`, { method:'DELETE',
      headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}}).then(r=>r.ok);
    if (ok) {
      setRows(rows.filter(r => r.id !== id));
      toast.success('Task deleted');
    } else toast.error('Delete failed');
  };

  const onSave = task => {
    setModal(null);
    if (!task) { toast.error('Save failed'); return; }
    setRows(modal.mode==='add' ? [...rows, task] : rows.map(r => r.id===task.id?task:r));
  };

  if (loading) return <p className="p-6">Loading…</p>;

  return (
    <div className="relative">
      <button onClick={() => setModal({ mode:'add' })}
              className="absolute -top-12 right-0 flex items-center gap-1 text-blue-600 hover:text-blue-800">
        <PlusCircle size={18}/> Add Task
      </button>

      {/* filter bar */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
        <input
          placeholder="Search title…"
          className="border rounded px-2 py-1 col-span-2 md:col-span-1"
          value={filters.text}
          onChange={e => setFilter({ ...filters, text:e.target.value })}
        />
        <select value={filters.week} onChange={e=>setFilter({...filters,week:e.target.value})} className="border rounded px-2 py-1">{weekOpts.map(o=> <option key={o}>{o}</option>)}</select>
        <select value={filters.cat}  onChange={e=>setFilter({...filters,cat: e.target.value})} className="border rounded px-2 py-1">{catOpts.map(o=>  <option key={o}>{o}</option>)}</select>
        <select value={filters.fmt}  onChange={e=>setFilter({...filters,fmt: e.target.value})} className="border rounded px-2 py-1">{fmtOpts.map(o=>  <option key={o}>{o}</option>)}</select>
        <select value={filters.own}  onChange={e=>setFilter({...filters,own: e.target.value})} className="border rounded px-2 py-1">{ownOpts.map(o=>  <option key={o}>{o}</option>)}</select>
        <select value={filters.role} onChange={e=>setFilter({...filters,role:e.target.value})} className="border rounded px-2 py-1">{roleOpts.map(o=> <option key={o}>{o}</option>)}</select>
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th onClick={()=>toggleSort('week_num')} className="px-3 py-2 border cursor-pointer">Week {sortIcon('week_num')}</th>
              <th onClick={()=>toggleSort('title')}    className="px-3 py-2 border cursor-pointer text-left">Title {sortIcon('title')}</th>
              <th className="px-3 py-2 border">Category</th>
              <th className="px-3 py-2 border">Format</th>
              <th className="px-3 py-2 border">Owner</th>
              <th onClick={()=>toggleSort('roles')}    className="px-3 py-2 border cursor-pointer">Roles {sortIcon('roles')}</th>
              <th className="px-3 py-2 border text-center">Link</th>
              <th className="px-3 py-2 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(r => (
              <tr key={r.id} className="odd:bg-gray-50">
                <td className="align-top px-3 py-2 border text-center">{r.week_num}</td>
                <td className="align-top px-3 py-2 border whitespace-nowrap max-w-xs overflow-hidden text-ellipsis" title={r.title}>{r.title}</td>
                <td className="align-top px-3 py-2 border text-center">{r.category}</td>
                <td className="align-top px-3 py-2 border text-center">{r.format}</td>
                <td className="align-top px-3 py-2 border text-center">{r.assigned_to}</td>
                <td className="align-top px-3 py-2 border text-center whitespace-nowrap max-w-xs overflow-hidden text-ellipsis" title={r.roles}>{r.roles}</td>
                <td className="align-top px-3 py-2 border text-center">
                  {r.resource_url && (
                    <a href={r.resource_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      <ExternalLink size={16}/>
                    </a>
                  )}
                </td>
                <td className="align-top px-3 py-2 border text-center flex justify-center gap-3">
                  <Pencil size={16} className="text-blue-600 cursor-pointer hover:text-blue-800"
                          onClick={()=>setModal({mode:'edit',row:r})}/>
                  <Trash2 size={16} className="text-red-600 cursor-pointer hover:text-red-800"
                          onClick={()=>remove(r.id)}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <TaskFormModal
          mode={modal.mode}
          initial={modal.row}
          onSave={onSave}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
