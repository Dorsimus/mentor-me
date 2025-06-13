/*─────────────────────────────────────────────────────────────
  Mentor-Me API  –  PostgreSQL + OpenAI
─────────────────────────────────────────────────────────────*/
import 'dotenv/config';
import express  from 'express';
import cors     from 'cors';
import pg       from 'pg';
import bcrypt   from 'bcryptjs';
import jwt      from 'jsonwebtoken';
import OpenAI   from 'openai';

/*──────── configuration ────────*/
const openai     = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const signToken  = p => jwt.sign(p, JWT_SECRET, { expiresIn: '8h' });

/*──────── pg pool ──────────────*/
const pool = new pg.Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        user:     'postgres',
        host:     'localhost',
        database: 'mentorme',
        password: 'bjCSRdAOrO7h0YfT',
        port:     5432,
      },
);
const q = (sql, params) => pool.query(sql, params);

/*──────── auth middleware ──────*/
function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
  try { req.user = jwt.verify(h.slice(7), JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'invalid token' }); }
}

/*──────── express setup ────────*/
const app = express();
app.use(cors());
app.use(express.json());

/*============================================================
  Helper queries
============================================================*/
const percentQuery = async uid => {
  const [{ done }]  = (await q(
    'SELECT COUNT(*)::int AS done FROM task_progress WHERE user_id=$1 AND completed',
    [uid]
  )).rows;
  const [{ total }] = (await q('SELECT COUNT(*)::int AS total FROM tasks')).rows;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
};

const nextTasks = async uid => {
  const { rows } = await q(
    `SELECT t.title
       FROM tasks t
       LEFT JOIN task_progress p
              ON p.task_id = t.id
             AND p.user_id = $1
      WHERE COALESCE(p.completed,false) = false
      ORDER BY t.week_num, t.id
      LIMIT 3`,
    [uid]
  );
  return rows.map(r => r.title);
};

/*============================================================
  HEALTH
============================================================*/
app.get('/api', (_, res) => res.json({ message: 'Mentor-Me API' }));

/*============================================================
  ROLES CRUD
============================================================*/
app.get('/api/roles', async (_req, res) => {
  try { res.json((await q('SELECT id,name FROM roles ORDER BY id')).rows); }
  catch (e) { res.status(500).json({ error: 'db' }); }
});

app.post('/api/roles', async (req, res) => {
  const name = req.body.name?.trim();
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const { rows } = await q('INSERT INTO roles(name) VALUES($1) RETURNING *', [name]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'db' }); }
});

app.put('/api/roles/:id', async (req, res) => {
  const id = Number(req.params.id);
  const name = req.body.name?.trim();
  if (!name) return res.status(400).json({ error: 'name required' });
  try { await q('UPDATE roles SET name=$1 WHERE id=$2', [name, id]); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: 'db' }); }
});

app.delete('/api/roles/:id', async (req, res) => {
  const id = Number(req.params.id);
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query('UPDATE users SET role_id=NULL WHERE role_id=$1', [id]);
    await c.query('DELETE FROM role_tasks WHERE role_id=$1', [id]);
    await c.query('DELETE FROM roles WHERE id=$1', [id]);
    await c.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await c.query('ROLLBACK'); console.error(e);
    res.status(500).json({ error: 'db' });
  } finally { c.release(); }
});

/*============================================================
  TASKS & ROLE_TASKS
============================================================*/
/* tasks for a role (global + role-specific) */
app.get('/api/roles/:id/tasks', async (req, res) => {
  const rid = Number(req.params.id);
  try {
    const { rows } = await q(
      `SELECT t.*
         FROM tasks t
         LEFT JOIN role_tasks rt ON rt.task_id=t.id
        WHERE rt.role_id=$1
           OR NOT EXISTS (SELECT 1 FROM role_tasks WHERE task_id=t.id)
        GROUP BY t.id
        ORDER BY t.week_num, t.id`,
      [rid]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'db' }); }
});

/* create task */
app.post('/api/tasks', auth, async (req, res) => {
  const { title, week_num, category, format, assigned_to, resource_url } = req.body;
  if (!title || week_num == null || !category || !format || !assigned_to)
    return res.status(400).json({ error: 'missing fields' });

  try {
    const { rows } = await q(
      `INSERT INTO tasks(title,week_num,category,format,assigned_to,resource_url)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,
      [title, week_num, category, format, assigned_to, resource_url || null]
    );
    res.status(201).json({ task_id: rows[0].id });
  } catch (e) { res.status(500).json({ error: 'db' }); }
});

/* update task */
app.put('/api/tasks/:id', auth, async (req, res) => {
  const id = Number(req.params.id);
  const { title, week_num, category, format, assigned_to, resource_url } = req.body;
  try {
    await q(
      `UPDATE tasks SET
         title=$1, week_num=$2, category=$3, format=$4,
         assigned_to=$5, resource_url=$6
       WHERE id=$7`,
      [title, week_num, category, format, assigned_to, resource_url || null, id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'db' }); }
});

/* delete task & cascade rows */
app.delete('/api/tasks/:id', auth, async (req, res) => {
  const id = Number(req.params.id);
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query('DELETE FROM task_progress WHERE task_id=$1', [id]);
    await c.query('DELETE FROM role_tasks   WHERE task_id=$1', [id]);
    await c.query('DELETE FROM tasks        WHERE id=$1',     [id]);
    await c.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await c.query('ROLLBACK'); console.error(e);
    res.status(500).json({ error: 'db' });
  } finally { c.release(); }
});

/* map roles → task */
app.post('/api/role_tasks', auth, async (req, res) => {
  const { task_id, role_ids } = req.body;
  if (!task_id || !Array.isArray(role_ids) || !role_ids.length)
    return res.status(400).json({ error: 'task_id & role_ids[] required' });

  const values = role_ids.map((_,i)=>`($1,$${i+2})`).join(',');
  try {
    await q(
      `INSERT INTO role_tasks(task_id,role_id) VALUES ${values}
       ON CONFLICT DO NOTHING`,
      [task_id, ...role_ids]
    );
    res.status(201).json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'db' }); }
});

/* list all tasks (+ aggregated roles) */
app.get('/api/tasks/all', auth, async (_req, res) => {
  try {
    const { rows } = await q(`
      SELECT  t.id, t.title, t.week_num, t.category, t.format,
              t.assigned_to, t.resource_url,
              COALESCE(STRING_AGG(r.name, ', ' ORDER BY r.name),'Global') AS roles
        FROM tasks t
        LEFT JOIN role_tasks rt ON rt.task_id=t.id
        LEFT JOIN roles       r ON r.id=rt.role_id
       GROUP BY t.id
       ORDER BY t.week_num, t.id`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'db' }); }
});

/*============================================================
  PROGRESS
============================================================*/
app.get('/api/tasks/progress', async (req, res) => {
  const uid = Number(req.query.user_id);
  if (!uid) return res.status(400).json({ error: 'user_id required' });
  try {
    const { rows } = await q(
      'SELECT task_id,completed FROM task_progress WHERE user_id=$1',
      [uid]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'db' }); }
});
/* mark / un-mark task progress */
app.post('/api/tasks/:id/progress', async (req, res) => {
  const task_id = Number(req.params.id);
  const { user_id, completed, completed_at = null } = req.body;

  try {
    await q(`
      INSERT INTO task_progress(user_id,task_id,completed,completed_at)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (user_id,task_id)
      DO UPDATE SET completed=$3, completed_at=$4
    `, [user_id, task_id, completed, completed_at]);

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db' });
  }
});

/* progress summary */
app.get('/api/users/:id/progress_summary', async (req, res) => {
  const uid = Number(req.params.id);
  try {
    const [{ total_tasks }] =
      (await q('SELECT COUNT(*)::int AS total_tasks FROM tasks')).rows;
    const [{ completed_tasks }] =
      (await q('SELECT COUNT(*)::int AS completed_tasks FROM task_progress WHERE user_id=$1 AND completed',[uid])).rows;
    const weeks =
      (await q(`
        SELECT t.week_num,
               COUNT(t.*)::int AS total,
               COUNT(p.*)::int AS done
          FROM tasks t
          LEFT JOIN task_progress p
                 ON p.task_id=t.id AND p.user_id=$1 AND p.completed
         GROUP BY t.week_num
         ORDER BY t.week_num`,[uid])).rows;
    const tasks =
      (await q(`
        SELECT t.id,t.title,t.week_num,
               COALESCE(p.completed,false) AS completed,
               p.completed_at
          FROM tasks t
          LEFT JOIN task_progress p
                 ON p.task_id=t.id AND p.user_id=$1
         ORDER BY t.week_num,t.id`,[uid])).rows;

    res.json({ total_tasks, completed_tasks, weeks, tasks });
  } catch (e) { res.status(500).json({ error: 'db' }); }
});
/*──────── mentor suggestion (no user prompt) ────────*/
app.get('/api/mentor/suggest', async (req, res) => {
  const uid = Number(req.query.user_id);
  if (!uid) return res.status(400).json({ error: 'user_id required' });

  try {
    /* completion stats */
    const [{ done }]  =
      (await q('SELECT COUNT(*)::int AS done  FROM task_progress WHERE user_id=$1 AND completed',[uid])).rows;
    const [{ total }] =
      (await q('SELECT COUNT(*)::int AS total FROM tasks')).rows;
    const pct = total ? Math.round((done / total) * 100) : 0;

    /* next 3 incomplete tasks */
    const nextRows = await nextTasks(uid);   // helper already defined above
    const todo     = nextRows;               // array of titles

    const msgs = [];
    msgs.push(`Nice work—you’re ${pct}% done!`);

    if (todo.length) {
      msgs.push(
        `Up next: “${todo[0]}.” ${todo[0].toLowerCase().includes('meet')
          ? 'Meeting your team builds early rapport.'
          : 'Give it your best shot!'}`
      );
      if (todo[1]) msgs.push(`After that: “${todo[1]}.”`);
    } else {
      msgs.push('All tasks complete—amazing! 🎉');
    }

    res.json({ next_tasks: todo, messages: msgs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

/*============================================================
  USERS CRUD
============================================================*/
app.get('/api/users/all', async (_req, res) => {
  try {
    const { rows } = await q(`
      SELECT u.id,u.name,u.email,u.role_id,u.is_admin,
             COALESCE(r.name,'') AS role_name
        FROM users u
        LEFT JOIN roles r ON r.id=u.role_id
       ORDER BY u.id`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'db' }); }
});

app.post('/api/users', auth, async (req, res) => {
  const { name, email, role_id, is_admin=false } = req.body;
  try {
    const { rows } = await q(
      `INSERT INTO users(name,email,role_id,is_admin)
       VALUES($1,$2,$3,$4) RETURNING *`,
      [name, email, role_id ?? null, is_admin]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'db' }); }
});

app.put('/api/users/:id', auth, async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, role_id, is_admin=false } = req.body;
  try {
    const { rows } = await q(
      `UPDATE users
           SET name     = COALESCE($1,name),
               email    = COALESCE($2,email),
               role_id  = $3,
               is_admin = $4
         WHERE id = $5
         RETURNING *`,
      [name ?? null, email ?? null, role_id ?? null, is_admin, id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: 'db' }); }
});

app.delete('/api/users/:id', auth, async (req, res) => {
  const id = Number(req.params.id);
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query('DELETE FROM task_progress WHERE user_id=$1', [id]);
    await c.query('DELETE FROM users          WHERE id=$1',     [id]);
    await c.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await c.query('ROLLBACK'); res.status(500).json({ error: 'db' });
  } finally { c.release(); }
});

/*============================================================
  OVERVIEW (aggregate dashboard)
============================================================*/
app.get('/api/overview', async (_req, res) => {
  try {
    const [{ user_count }] =
      (await q('SELECT COUNT(*)::int AS user_count FROM users')).rows;
    const [{ task_count }] =
      (await q('SELECT COUNT(*)::int AS task_count FROM tasks')).rows;
    const [{ comp_count }] =
      (await q('SELECT COUNT(*)::int AS comp_count FROM task_progress WHERE completed')).rows;

    const role_stats = (await q(`
      SELECT r.name AS role,
             COUNT(t.*)::int AS total,
             COUNT(p.*)::int AS done
        FROM roles r
        LEFT JOIN users u       ON u.role_id = r.id
        LEFT JOIN role_tasks rt ON rt.role_id = r.id
        LEFT JOIN tasks t       ON t.id = rt.task_id
        LEFT JOIN task_progress p
               ON p.task_id = t.id AND p.user_id = u.id AND p.completed
       GROUP BY r.name
       ORDER BY r.name`)).rows;

    const week_stats = (await q(`
      SELECT t.week_num,
             COUNT(t.*)::int AS total,
             COUNT(p.*)::int AS done
        FROM tasks t
        LEFT JOIN task_progress p
               ON p.task_id=t.id AND p.completed
       GROUP BY t.week_num
       ORDER BY t.week_num`)).rows;

    res.json({ user_count, task_count, comp_count, role_stats, week_stats });
  } catch (e) { res.status(500).json({ error: 'db' }); }
});

/*============================================================
  AUTH
============================================================*/
app.post('/api/auth/login', async (req,res)=>{
  const { email,password } = req.body;
  try {
    const { rows } = await q('SELECT * FROM users WHERE email=$1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'invalid' });
    const u = rows[0];
    if (!u.password_hash || !bcrypt.compareSync(password, u.password_hash))
      return res.status(401).json({ error: 'invalid' });

    const token = signToken({
      id: u.id, name: u.name, role_id: u.role_id, is_admin: u.is_admin,
    });
    res.json({ token, user:{ id:u.id, name:u.name, role_id:u.role_id, is_admin:u.is_admin }});
  } catch (e) { res.status(500).json({ error: 'db' }); }
});

app.get('/api/auth/me', auth, async (req,res)=>{
  try{
    const { rows } = await q(
      'SELECT id,name,role_id,is_admin FROM users WHERE id=$1',
      [req.user.id]
    );
    res.json(rows[0]);
  }catch(e){ res.status(500).json({ error: 'db' }); }
});

/*============================================================
  ALIAS & SERVER START
============================================================*/
app.get('/api/users', (req,res,next)=>{ req.url='/api/users/all'; next(); });
/* POST /api/mentor/chat  { user_id, message } → ai_reply */
app.post('/api/mentor/chat', async (req, res) => {
  const { user_id, message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'message required' });

  let reply = 'I’m here to help! (AI temporarily unavailable)';

  try {
    /* ---------- build quick context ---------- */
    const [{ done }]  = (await q(
      'SELECT COUNT(*)::int AS done FROM task_progress WHERE user_id=$1 AND completed',
      [user_id]
    )).rows;
    const [{ total }] = (await q('SELECT COUNT(*)::int AS total FROM tasks')).rows;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const next  = await nextTasks(user_id);
    const next1 = next[0] ? `Next up: “${next[0]}.”` : 'All tasks done! 🎉';

    const sysPrompt = `
      You are “Redstone Onboarding Mentor”.
      • Progress: ${done}/${total} (${pct}%)
      • Upcoming: ${next.slice(0,3).join(' / ') || 'none'}
      Keep replies under 60 words, upbeat.
    `.trim();

    /* ---------- OpenAI ---------- */
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',               // or gpt-3.5-turbo
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user',   content: message },
      ],
    });

    reply = chat.choices[0].message.content.trim();
  } catch (err) {
    console.error('mentor error', err.message);
    /* reply stays as fallback text */
  }

  res.json({ reply });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log('Server running on',PORT));
