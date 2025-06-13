import React, { useContext, useEffect, useRef, useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { AuthContext } from '../AuthContext';

export const bus = window;
const uuid = () => crypto.randomUUID();

const Bubble = ({ from, children }) => (
  <div
    className={`px-3 py-2 rounded-lg max-w-[75%] whitespace-pre-wrap ${
      from === 'mentor'
        ? 'bg-blue-600 text-white self-start'
        : 'bg-gray-200 text-gray-800 self-end'
    }`}
  >
    {children}
  </div>
);

export default function MentorChat() {
  const { user, token } = useContext(AuthContext);

  const [open,   setOpen]   = useState(false);
  const [log,    setLog]    = useState([]);   // {id,from,text,system?}
  const [msg,    setMsg]    = useState('');
  const [typing, setTyping] = useState(false);
  const bottom = useRef(null);

  const add = (from, text, system = false) =>
    setLog(l => [...l, { id: uuid(), from, text, system }]);

  /* scroll */
  useEffect(() => bottom.current?.scrollIntoView({ behavior: 'smooth' }), [log, typing]);

  /* pull mentor tip and REPLACE previous tips */
  const refreshTips = async () => {
    if (!user) return;
    const data = await fetch(`/api/mentor/suggest?user_id=${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).catch(() => null);

    if (data?.messages?.length) {
      setLog(l => l.filter(b => !b.system));          // drop old system lines
      data.messages.forEach(t => add('mentor', t, true));
    }
  };

  /* open drawer → initial tips */
  useEffect(() => { if (open) refreshTips(); }, [open]);

  /* cheer event */
  useEffect(() => {
    const handler = e => {
      const { cheer, title } = e.detail;
      setOpen(true);
      add('mentor', `${cheer} ✓ “${title}” complete!`);
      refreshTips();                                  // one fresh tip set
    };
    bus.addEventListener('mentorCongrats', handler);
    return () => bus.removeEventListener('mentorCongrats', handler);
  }, [user]);

  /* send msg */
  async function send() {
    if (!msg.trim()) return;
    const text = msg.trim();
    setMsg('');
    add('user', text);
    setTyping(true);

    const res = await fetch('/api/mentor/chat', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        Authorization:`Bearer ${token}`,
      },
      body: JSON.stringify({ user_id:user.id, message:text }),
    }).then(r=>r.json()).catch(()=>null);

    setTyping(false);
    res?.reply
      ? add('mentor', res.reply)
      : add('mentor', 'Sorry, I had trouble responding.');
  }

  /* UI */
  return (
    <>
      {!open && (
        <button
          onClick={()=>setOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700
                     text-white p-4 rounded-full shadow-lg flex items-center gap-2"
        >
          <MessageSquare size={20}/><span className="hidden sm:inline">Mentor</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-transparent" onClick={()=>setOpen(false)}/>
          <div className="absolute bottom-24 right-6 sm:bottom-20">
            <div className="relative w-80 sm:w-96 bg-white rounded-2xl shadow-xl flex flex-col">
              <div className="absolute -bottom-3 right-6 w-4 h-4 rotate-45 bg-white shadow-md" />
              <div className="flex justify-between items-center px-4 py-2 border-b rounded-t-2xl">
                <h2 className="text-sm font-semibold">AI Mentor</h2>
                <button onClick={()=>setOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={18}/>
                </button>
              </div>

              <div className="h-80 overflow-y-auto px-3 py-3 flex flex-col gap-2">
                {log.map(b=><Bubble key={b.id} from={b.from}>{b.text}</Bubble>)}
                {typing && <Bubble from="mentor">…typing</Bubble>}
                <div ref={bottom}/>
              </div>

              <div className="px-3 py-2 border-t flex gap-2 rounded-b-2xl">
                <input
                  className="flex-1 border rounded px-2 py-1 text-sm"
                  placeholder="Ask me something…"
                  value={msg}
                  onChange={e=>setMsg(e.target.value)}
                  onKeyDown={e=>e.key==='Enter' && send()}
                />
                <button
                  onClick={send}
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-40"
                  disabled={!msg.trim()}
                >
                  <Send size={18}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
