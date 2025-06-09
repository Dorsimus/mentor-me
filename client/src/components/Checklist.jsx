import React, {
  useEffect, useState, useRef, useContext,
} from 'react';
import { toast } from 'react-hot-toast';
import {
  BookOpen, BarChartBig, Sparkles,
  User, Users, Globe, Home,
  UserCircle, Handshake, Building2, Swords,
  CheckCircle2, ExternalLink,
} from 'lucide-react';
import {
  DragDropContext, Droppable, Draggable,
} from 'react-beautiful-dnd';
import ProgressBar from './ProgressBar';
import { SearchContext } from '../App';

/* ───── constants ───── */
const USER_ID = 1;
const ROLE_ID = 2;
const cheers = [
  'Great job!', 'Nice work!', 'Well done!', 'You did it!', 'Awesome!',
  'High five!', 'Crushed it!', 'Boom!', 'Another one done!', 'Keep it up!',
  'Fantastic!', 'Sweet!', 'Woo-hoo!', 'On fire!', 'Rockstar!',
  'Impressive!', 'Champion!', 'Legend!', 'Superb!', 'Nailed it!',
];

/* icon look-ups */
const categoryIcon = {
  Resource:           { Icon: BookOpen,    color: 'text-teal-600' },
  'KPI & Task-Based': { Icon: BarChartBig, color: 'text-sky-600'  },
  'Redstone Moment':  { Icon: Sparkles,    color: 'text-[#ff3443]'},
};
const formatIcon = {
  'Self-Led':       { Icon: User,   color: 'text-purple-600' },
  'With Mentor':    { Icon: Users,  color: 'text-fuchsia-600'},
  'With Regional':  { Icon: Globe,  color: 'text-green-600'  },
  'With Home Base': { Icon: Home,   color: 'text-orange-600' },
};
const ownerIcon = {
  Self:        { Icon: UserCircle, color: 'text-purple-600' },
  Mentor:      { Icon: Handshake,  color: 'text-fuchsia-600'},
  Leader:      { Icon: Swords,     color: 'text-rose-600'   },
  'Home Base': { Icon: Building2,  color: 'text-orange-600' },
};

/* small helpers */
const IconTip = ({ Icon, color, label }) => (
  <span className="relative inline-block group">
    <Icon size={18} className={color} />
    <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap
                     rounded bg-gray-800 px-2 py-0.5 text-[10px] text-white
                     opacity-0 group-hover:opacity-100 transition pointer-events-none">
      {label}
    </span>
  </span>
);
const Gap = () => <span style={{ width: 18, height: 18 }} />;
const MiniBar = ({ done, total }) => (
  <div className="w-24 h-1.5 bg-gray-200 rounded overflow-hidden">
    <div className="h-full bg-blue-600" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
  </div>
);

/* ───── component ───── */
export default function Checklist() {
  const [tasks, setTasks]   = useState([]);
  const [openWeek, setOpen] = useState(1);
  const [loading, setLoad]  = useState(true);
  const [flashId, setFlash] = useState(null);   // highlight id

  const { search, setSearch } = useContext(SearchContext);
  const taskRefs = useRef({});

  /* fetch tasks + progress */
  useEffect(() => {
    (async () => {
      const list = await fetch(`/api/roles/${ROLE_ID}/tasks`).then(r => r.json());
      list.forEach((t, i) => { t.order = i; t.completed_at = null; });
      const prog = await fetch(`/api/tasks/progress?user_id=${USER_ID}`)
        .then(r => (r.ok ? r.json() : []));
      const doneSet = new Set(prog.filter(p => p.completed).map(p => p.task_id));
      setTasks(list.map(t => ({ ...t, completed: doneSet.has(t.id) })));
      setLoad(false);
    })();
  }, []);

  /* search jump + glow */
  useEffect(() => {
    if (!search) return;
    const hit = tasks.find(
      t => !t.completed && t.title.toLowerCase().includes(search.toLowerCase())
    );
    if (hit) {
      setOpen(hit.week_num);
      setFlash(hit.id);
      setTimeout(() => setFlash(null), 1500);
      setTimeout(() => {
        taskRefs.current[hit.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [search, tasks]);

  /* clear search on unmount */
  useEffect(() => () => setSearch(''), []);

  /* toggle complete */
  async function toggle(task) {
    const next = !task.completed;
    const stamp = next ? new Date().toLocaleDateString('en-US') : null;

    setTasks(prev =>
      prev.map(t =>
        t.id === task.id ? { ...t, completed: next, completed_at: stamp } : t
      )
    );

    await fetch(`/api/tasks/${task.id}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: USER_ID, completed: next, completed_at: stamp }),
    }).catch(() => {});

    toast(
      next
        ? cheers[Math.floor(Math.random() * cheers.length)]
        : 'Progress saved',
      { position: 'bottom-center', duration: 2500, icon: next ? '🎉' : undefined }
    );
  }

  /* drag handler */
  function onDragEnd(res, weekNum) {
    if (!res.destination) return;
    const src = res.source.index, dst = res.destination.index;

    setTasks(prev => {
      const clone = [...prev];
      const active = clone
        .filter(t => t.week_num === weekNum && !t.completed)
        .sort((a, b) => a.order - b.order);

      const [moved] = active.splice(src, 1);
      active.splice(dst, 0, moved);
      active.forEach((t, i) => (t.order = i));
      return clone;
    });
  }

  if (loading) return <p>Loading…</p>;

  /* group by week */
  const groups = tasks.reduce((acc, t) => ((acc[t.week_num] ??= []).push(t), acc), {});
  const weeks = Object.keys(groups)
    .map(Number)
    .sort((a, b) => {
      const doneA = groups[a].every(t => t.completed);
      const doneB = groups[b].every(t => t.completed);
      return doneA !== doneB ? (doneA ? 1 : -1) : a - b;
    });

  const totalDone = tasks.filter(t => t.completed).length;
  const upNext    = weeks.flatMap(w => groups[w].filter(t => !t.completed)).slice(0, 3);

  return (
    <div className="max-w-xl mx-auto mt-8 space-y-4">
      {/* global progress */}
      <div className="p-6 bg-gray-50 border shadow rounded space-y-4">
        <h2 className="text-2xl font-semibold">Onboarding Checklist</h2>
        <ProgressBar completed={totalDone} total={tasks.length} />
      </div>

      {/* up next */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded shadow">
        <h3 className="font-semibold text-blue-700 mb-2">Up Next</h3>
        {upNext.length ? (
          <ul className="text-sm space-y-1">
            {upNext.map(t => <li key={t.id}>• {t.title}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">All caught up—nice!</p>
        )}
      </div>

      {/* weeks accordion */}
      {weeks.map(w => {
        const list = groups[w];
        const done = list.filter(t => t.completed).length;
        const allDone = done === list.length;

        const active    = list.filter(t => !t.completed).sort((a, b) => a.order - b.order);
        const completed = list.filter(t =>  t.completed);

        return (
          <div
            key={w}
            className={`mb-4 border shadow rounded ${allDone ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}
          >
            {/* week header */}
            <button
              onClick={() => setOpen(o => (o === w ? null : w))}
              className={`flex justify-between items-center w-full px-4 py-3 font-semibold ${
                allDone ? 'text-green-700' : 'text-blue-700'
              }`}
            >
              <span>Week {w}</span>
              <div className="flex items-center gap-3">
                <MiniBar done={done} total={list.length} />
                <span>{openWeek === w ? '▲' : '▼'}</span>
              </div>
            </button>

            {/* body */}
            {openWeek === w && (
              <div className="px-4 pb-4">
                {/* draggable active list */}
                <DragDropContext onDragEnd={res => onDragEnd(res, w)}>
                  <Droppable droppableId={`week-${w}`}>
                    {prov => (
                      <div ref={prov.innerRef} {...prov.droppableProps}>
                        {active.map((t, idx) => (
                          <Draggable key={t.id} draggableId={String(t.id)} index={idx}>
                            {drag => (
                              <div
                                ref={el => {
                                  drag.innerRef(el);
                                  taskRefs.current[t.id] = el;
                                }}
                                {...drag.draggableProps}
                                {...drag.dragHandleProps}
                                className={`py-2 px-3 my-1 border rounded hover:bg-gray-100 transition
                                           grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-3
                                           ${flashId === t.id ? 'animate-pulse bg-yellow-100' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 accent-green-600"
                                  checked={false}
                                  onChange={() => toggle(t)}
                                />

                                <span>{t.title}</span>
                                <IconTip {...(categoryIcon[t.category] ?? categoryIcon.Resource)} label={t.category} />
                                <IconTip {...(formatIcon[t.format] ?? formatIcon['Self-Led'])}   label={t.format} />
                                <IconTip {...(ownerIcon[t.assigned_to] ?? ownerIcon.Self)}       label={t.assigned_to} />
                                {t.resource_url ? (
                                  <a
                                    href={t.resource_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <ExternalLink size={16} />
                                  </a>
                                ) : (
                                  <Gap />
                                )}
                                {t.completed_at && (
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {t.completed_at}
                                  </span>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {prov.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {/* completed list */}
                {completed.map(t => (
                  <div
                    key={t.id}
                    ref={el => (taskRefs.current[t.id] = el)}
                    className={`py-2 px-3 my-1 border rounded bg-gray-50
                               grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-3
                               ${flashId === t.id ? 'animate-pulse bg-yellow-100' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-green-600"
                      checked
                      onChange={() => toggle(t)}   /* can uncheck now */
                    />
                    <span className="line-through text-gray-400">{t.title}</span>

                    <IconTip Icon={CheckCircle2} color="text-green-600" label="Completed" />

                    {/* keep category / format / owner placeholders aligned */}
                    <Gap /><Gap />

                    {t.resource_url ? (
                      <a
                        href={t.resource_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink size={16} />
                      </a>
                    ) : (
                      <Gap />
                    )}

                    {t.completed_at && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {t.completed_at}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
