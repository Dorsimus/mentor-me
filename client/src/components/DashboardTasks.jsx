import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  ExternalLink, Pencil, Trash2, ChevronsUpDown, PlusCircle,
} from 'lucide-react';
import TaskFormModal from './TaskFormModal';

/* ────── helper to build 'All' dropdowns ────── */
const buildOptions = (rows, key) =>
  ['All', ...new Set(rows.map(r => r[key]).filter(Boolean))];

/* ───────────────── component ──────────────── */
export default function Dashboard() {
  /* data */
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  /* sort */
  const [sortCol, setSort] = useState('week_num');
  const [dir, setDir] = useState('asc');

  /* filters */
  const [weekFilter,     setWF] = useState('All');
  const [catFilter,      setCF] = useState('All');
  const [formatFilter,   setFF] = useState('All');
  const [ownerFilter,    setOF] = useState('All');
  const [roleFilter,     setRL] = useState('All');
  const [titleSearch,    setTS] = useState('');

  /* modal state */
  const [modal, setModal] = useState(null);   // null | {mode:'add'} | {mode:'edit',row}

  /* initial fetch */
  useEffect(() => {
    (async () => {
      const data = await fetch('/api/tasks/all').then(r => r.json());
      setRows(data);
      setLoading(false);
    })();
  }, []);

  /* derived dropdown option lists */
  const weekOptions   = React.useMemo(() => buildOptions(rows, 'week_num'), [rows]);
  const catOptions    = React.useMemo(() => buildOptions(rows, 'category'), [rows]);
  const formatOptions = React.useMemo(() => buildOptions(rows, 'format'), [rows]);
  const ownerOptions  = React.useMemo(() => buildOptions(rows, 'assigned_to'), [rows]);
  const roleOptions   = React.useMemo(
    () => ['All', ...new Set(rows.flatMap(r => r.roles.split(', ')))],
    [rows]);

  /* filtered + sorted rows */
  const visible = rows
    .filter(r => (weekFilter   === 'All' || r.week_num     === Number(weekFilter)))
    .filter(r => (catFilter    === 'All' || r.category     === catFilter))
    .filter(r => (formatFilter === 'All' || r.format       === formatFilter))
    .filter(r => (ownerFilter  === 'All' || r.assigned_to  === ownerFilter))
    .filter(r => (roleFilter   === 'All' || r.roles.split(', ').includes(roleFilter)))
    .filter(r => r.title.toLowerCase().includes(titleSearch.toLowerCase()))
    .sort((a, b) => {
      const d = dir === 'asc' ? 1 : -1;
      if (a[sortCol] < b[sortCol]) return -1 * d;
      if (a[sortCol] > b[sortCol]) return  1 * d;
      return 0;
    });

  /* sort helpers */
  const sortIcon = col => (
    <ChevronsUpDown size={14} className={`inline ml-1 ${col === sortCol ? 'text-blue-600' : 'text-gray-300'}`} />
  );
  const toggleSort = col => {
    if (col === sortCol) setDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSort(col); setDir('asc'); }
  };

  /* delete */
  const remove = async id => {
    if (!window.confirm('Delete this task?')) return;
    const ok = await fetch(`/api/tasks/${id}`, { method: 'DELETE' }).then(r => r.ok);
    if (ok) {
      setRows(rows.filter(r => r.id !== id));
      toast.success('Task deleted', { duration: 1500, position: 'top-center' });
    } else toast.error('Delete failed');
  };

  /* modal save */
  const handleSave = (newRow, err) => {
    setModal(null);
    if (!newRow) { toast.error(err); return; }

    if (modal.mode === 'add') setRows([...rows, newRow]);
    else setRows(rows.map(r => (r.id === newRow.id ? newRow : r)));
  };

  if (loading) return <p className="p-6">Loading…</p>;

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6 bg-white shadow rounded relative">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard — All Tasks</h1>

      {/* add button */}
      <button
        onClick={() => setModal({ mode: 'add' })}
        className="absolute top-6 right-6 flex items-center gap-1 text-blue-600 hover:text-blue-800"
      >
        <PlusCircle size={18} /> Add Task
      </button>

      {/* filter bar */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
        <input
          placeholder="Search title…"
          className="border rounded px-2 py-1 col-span-2 md:col-span-1"
          value={titleSearch}
          onChange={e => setTS(e.target.value)}
        />

        <select value={weekFilter} onChange={e => setWF(e.target.value)} className="border rounded px-2 py-1">
          {weekOptions.map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={catFilter}  onChange={e => setCF(e.target.value)}  className="border rounded px-2 py-1">
          {catOptions.map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={formatFilter} onChange={e => setFF(e.target.value)} className="border rounded px-2 py-1">
          {formatOptions.map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={ownerFilter} onChange={e => setOF(e.target.value)} className="border rounded px-2 py-1">
          {ownerOptions.map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={roleFilter} onChange={e => setRL(e.target.value)} className="border rounded px-2 py-1">
          {roleOptions.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th onClick={() => toggleSort('week_num')} className="px-3 py-2 border cursor-pointer">Week {sortIcon('week_num')}</th>
              <th onClick={() => toggleSort('title')}    className="px-3 py-2 border cursor-pointer text-left">Title {sortIcon('title')}</th>
              <th className="px-3 py-2 border">Category</th>
              <th className="px-3 py-2 border">Format</th>
              <th className="px-3 py-2 border">Owner</th>
              <th onClick={() => toggleSort('roles')}    className="px-3 py-2 border cursor-pointer">Roles {sortIcon('roles')}</th>
              <th className="px-3 py-2 border text-center">Link</th>
              <th className="px-3 py-2 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(r => (
              <tr key={r.id} className="odd:bg-gray-50">
                <td className="align-top px-3 py-2 border text-center">{r.week_num}</td>
                <td className="align-top px-3 py-2 border whitespace-nowrap max-w-xs overflow-hidden text-ellipsis" title={r.title}>{r.title}</td>
                <td className="align-top px-3 py-2 border text-center whitespace-nowrap max-w-xs overflow-hidden text-ellipsis" title={r.category}>{r.category}</td>
                <td className="align-top px-3 py-2 border text-center whitespace-nowrap max-w-xs overflow-hidden text-ellipsis" title={r.format}>{r.format}</td>
                <td className="align-top px-3 py-2 border text-center whitespace-nowrap max-w-xs overflow-hidden text-ellipsis" title={r.assigned_to}>{r.assigned_to}</td>
                <td className="align-top px-3 py-2 border text-center whitespace-nowrap max-w-xs overflow-hidden text-ellipsis" title={r.roles}>{r.roles}</td>
                <td className="align-top px-3 py-2 border text-center">
                  {r.resource_url && (
                    <a href={r.resource_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      <ExternalLink size={16} />
                    </a>
                  )}
                </td>
                <td className="align-top px-3 py-2 border text-center flex justify-center gap-3">
                  <Pencil size={16} className="text-blue-600 cursor-pointer hover:text-blue-800" onClick={() => setModal({ mode:'edit', row:r })}/>
                  <Trash2 size={16} className="text-red-600 cursor-pointer hover:text-red-800"  onClick={() => remove(r.id)}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* modal */}
      {modal && (
        <TaskFormModal
          mode={modal.mode}
          initial={modal.row}
          onSave={handleSave}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
