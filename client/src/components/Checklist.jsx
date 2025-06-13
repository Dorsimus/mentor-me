import React, {
  useEffect, useState, useRef, useContext, useCallback, useMemo,
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
import MentorChat   from './MentorChat';
import { SearchContext } from '../App';
import { bus } from './MentorChat';
import { AuthContext } from '../AuthContext';
import { useParams } from 'react-router-dom';   

/* ───── constants ───── */
const cheers = [
  'Great job!', 'Nice work!', 'Well done!', 'You did it!', 'Awesome!',
  'High five!', 'Crushed it!', 'Boom!', 'Another one done!', 'Keep it up!',
];

/* icon maps */
const categoryIcon = {
  Resource:           { Icon: BookOpen,   color: 'text-teal-600' },
  'KPI & Task-Based': { Icon: BarChartBig,color: 'text-sky-600'  },
  'Redstone Moment':  { Icon: Sparkles,   color: 'text-[#ff3443]'},
};
const formatIcon = {
  'Self-Led':       { Icon: User,   color: 'text-purple-600' },
  'With Mentor':    { Icon: Users,  color: 'text-fuchsia-600'},
  'With Leader':    { Icon: Globe,  color: 'text-green-600'  },
  'With Home Base': { Icon: Home,   color: 'text-orange-600' },
};
const ownerIcon = {
  Self:        { Icon: UserCircle, color: 'text-purple-600' },
  Mentor:      { Icon: Handshake,  color: 'text-fuchsia-600'},
  Leader:      { Icon: Swords,     color: 'text-rose-600'   },
  'Home Base': { Icon: Building2,  color: 'text-orange-600' },
};
const Gap = () => <span style={{ width: 18, height: 18 }} />;

/* ───── helpers ───── */
function prepareTasks(list, progress) {
  const done = new Set(progress.filter(p => p.completed).map(p => p.task_id));
  return list.map((t, i) => ({
    ...t,
    order: t.order ?? i,
    completed: done.has(t.id),
    completed_at: done.has(t.id)
      ? progress.find(p => p.task_id === t.id)?.completed_at ?? null
      : null,
  }));
}

/* mini progress — used in week header */
function MiniBar({ completed, total }) {
  const pct = total ? (completed / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 w-40">
      <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
        <div
          style={{ width: `${pct}%` }}
          className="h-full bg-green-500 transition-all"
        />
      </div>
      <span className="text-xs tabular-nums">{completed}/{total}</span>
    </div>
  );
}

/* ───── component ───── */
export default function Checklist() {
  /* contexts */
  const { search, setSearch } = useContext(SearchContext);
  const { user }              = useContext(AuthContext);
  const roleId                = user?.role_id ?? 0;

  /* route param fallback */
  const { checklistId: routeId } = useParams();
  const checklistId = propChecklistId || routeId || null

  /* state */
  const [tasks,   setTasks]   = useState([]);
  const [openWeek,setOpen]    = useState(1);
  const [loading, setLoad]    = useState(true);
  const [flashId, setFlash]   = useState(null);
  const taskRefs              = useRef({});

  /* fetch tasks for EITHER legacy flow or new checklist instance */
  useEffect(() => {
    if (!user) return;
    const ac      = new AbortController();
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

    (async () => {
      try {
        setLoad(true);
         /* -------- fetch tasks -------- */
        const taskUrl = checklistId
          ? `/api/user_checklists/${checklistId}/tasks`
          : `/api/roles/${roleId}/tasks`;

        const [taskRes, progRes] = await Promise.all([
          fetch(taskUrl,                            { headers, signal: ac.signal }),
          fetch(`/api/tasks/progress?user_id=${user.id}`, { headers, signal: ac.signal }),
        ]);
        const taskJson = await taskRes.json();
        const progJson = progRes.ok ? await progRes.json() : [];
        setTasks(prepareTasks(taskJson, progJson));
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
      } finally {
        setLoad(false);
      }
    })();
    return () => ac.abort();
  }, [user, roleId]);

  /* search jump + glow */
  useEffect(() => {
    if (!search) return;
    const hit = tasks.find(t =>
      !t.completed && t.title.toLowerCase().includes(search.toLowerCase())
    );
    if (hit) {
      if (openWeek !== hit.week_num) setOpen(hit.week_num);
      setFlash(hit.id);
      setTimeout(() => setFlash(null), 1500);
      setTimeout(() => taskRefs.current[hit.id]?.scrollIntoView({
        behavior: 'smooth', block: 'center',
      }), 200);
    }
  }, [search, tasks, openWeek]);

  /* clear search on unmount */
  useEffect(() => () => setSearch(''), [setSearch]);

  /* toggle complete */
  const toggle = useCallback(async (task) => {
    const next  = !task.completed;
    const stamp = next ? new Date().toISOString() : null;

    setTasks(prev =>
      prev.map(t => (t.id === task.id ? { ...t, completed: next, completed_at: stamp } : t)),
    );

    fetch(`/api/tasks/${task.id}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        user_id: user.id,
        completed: next,
        completed_at: stamp,
        user_checklist_id: checklistId,
      }),
    }).catch(() => {});

    if (next) {
      const cheer = cheers[Math.floor(Math.random() * cheers.length)];
      bus.dispatchEvent(
        new CustomEvent('mentorCongrats', {
          detail: { cheer, title: task.title, userId: user.id },
        }),
      );
    }
    toast(next ? 'Progress saved 🎉' : 'Progress updated');
  }, [user]);

  /* drag handler */
  const onDragEnd = useCallback((res, week) => {
    if (!res.destination) return;
    const { source: { index: src }, destination: { index: dst } } = res;

    setTasks(prev => {
      const clone = [...prev];
      const active = clone
        .filter(t => t.week_num === week && !t.completed)
        .sort((a, b) => a.order - b.order);

      const [mv] = active.splice(src, 1);
      active.splice(dst, 0, mv);
      active.forEach((t, i) => { t.order = i; });
      return clone;
    });
  }, []);

  /* memoised grouping */
  const { groups, weeks } = useMemo(() => {
    const g = tasks.reduce((a, t) => {
      (a[t.week_num] ??= []).push(t);
      return a;
    }, {});
    return { groups: g, weeks: Object.keys(g).map(Number).sort((a, b) => a - b) };
  }, [tasks]);

  const totalDone = tasks.filter(t => t.completed).length;
  const upNext    = weeks.flatMap(w => groups[w].filter(t => !t.completed)).slice(0, 3);

  /* ── render ─────────────────────────────── */
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
        {loading ? (
          <p className="text-sm text-gray-600 italic">Loading…</p>
        ) : upNext.length ? (
          <ul className="text-sm space-y-1">
            {upNext.map(t => <li key={t.id}>• {t.title}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">All caught up—nice!</p>
        )}
      </div>

      {/* week groups */}
      {!loading && weeks.map(w => {
        const list      = groups[w];
        const completed = list.filter(t =>  t.completed).length;
        const active    = list.filter(t => !t.completed).sort((a, b) => a.order - b.order);

        return (
          <div key={w} className="border rounded shadow mb-4">
            {/* header */}
            <button
              onClick={() => setOpen(o => (o === w ? null : w))}
              className="flex justify-between w-full px-4 py-3 bg-gray-100 font-medium hover:bg-gray-200 transition-colors"
            >
              <span className="flex items-center gap-2">
                Week&nbsp;{w}
              </span>
              <MiniBar completed={completed} total={list.length} />
              <span>{openWeek === w ? '▲' : '▼'}</span>
            </button>

            {openWeek === w && (
              <div className="px-4 pb-4 animate-[slideDown_0.25s_ease-out]">
                {/* draggable active list */}
                <DragDropContext onDragEnd={r => onDragEnd(r, w)}>
                  <Droppable droppableId={`week-${w}`}>
                    {(prov) => (
                      <div ref={prov.innerRef} {...prov.droppableProps}>
                        {active.map((t, i) => (
                          <Draggable key={t.id} draggableId={String(t.id)} index={i}>
                            {(drag) => (
                              <TaskRow
                                t={t}
                                drag={drag}
                                isFlash={flashId === t.id}
                                toggle={toggle}
                                taskRefs={taskRefs}
                                zebra={i % 2 === 1}
                              />
                            )}
                          </Draggable>
                        ))}
                        {prov.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {/* completed list */}
                {completed > 0 && (
                  <div className="mt-4 space-y-1">
                    {list.filter(t => t.completed).map((t, i) => (
                      <TaskRow
                        key={t.id}
                        t={t}
                        isFlash={flashId === t.id}
                        toggle={toggle}
                        taskRefs={taskRefs}
                        completed
                        zebra={i % 2 === 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <MentorChat />
    </div>
  );
}

/* reusable task row */
function TaskRow({
  t, drag, isFlash, toggle, taskRefs, completed = false, zebra = false,
}) {
  /* choose icons */
  const Cat      = categoryIcon[t.category]?.Icon ?? BookOpen;
  const catColor = categoryIcon[t.category]?.color ?? 'text-teal-600';
  const Fmt      = formatIcon[t.format]?.Icon    ?? User;
  const fmtColor = formatIcon[t.format]?.color   ?? 'text-purple-600';
  const Own      = ownerIcon[t.assigned_to]?.Icon ?? UserCircle;
  const ownColor = ownerIcon[t.assigned_to]?.color ?? 'text-purple-600';

  const rowCls = `py-2 px-3 my-1 border rounded transition
                  grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3
                  ${isFlash ? 'animate-pulse bg-yellow-100' : ''}
                  ${completed ? 'bg-gray-50' : zebra ? 'bg-gray-50/70' : 'bg-white'}`;

  const iconProps = (label) => ({
    size: 18, className: 'shrink-0', title: label,
  });

  const content = (
    <>
      <input
        type="checkbox"
        className="h-4 w-4 accent-green-600"
        checked={completed}
        onChange={() => toggle(t)}
        title={completed ? 'Mark incomplete' : 'Mark complete'}
      />
      <span className={completed ? 'line-through text-gray-400' : ''}>{t.title}</span>

      {completed
        ? <CheckCircle2 size={18} className="text-green-600" title="Completed" />
        : <Cat  {...iconProps(t.category)}  className={catColor} />}

      {!completed && <Fmt {...iconProps(t.format)}  className={fmtColor} />}
      {!completed && <Own {...iconProps(t.assigned_to)} className={ownColor} />}

      {t.resource_url ? (
        <a
          href={t.resource_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
          title="Open resource"
        >
          <ExternalLink size={16} />
        </a>
      ) : <Gap />}
    </>
  );

  /* drag-aware wrapper */
  if (drag) {
    return (
      <div
        ref={(el) => { drag.innerRef(el); taskRefs.current[t.id] = el; }}
        {...drag.draggableProps}
        {...drag.dragHandleProps}
        className={rowCls}
      >
        {content}
      </div>
    );
  }
  return (
    <div ref={(el) => { taskRefs.current[t.id] = el; }} className={rowCls}>
      {content}
    </div>
  );
}

/* slide-down keyframes (Tailwind arbitrary) */
<style jsx>{`
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0);  }
}
`}</style>
