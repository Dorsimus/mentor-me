/* ───────────────────────────────
   Mentor-Me API (PostgreSQL)
   ─────────────────────────────── */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const app  = express();
app.use(cors());
app.use(express.json());

//console.log('DATABASE_URL ⇒', process.env.DATABASE_URL);
const pool = new pg.Pool({
  user:     'postgres',
  host:     'localhost',
  database: 'mentorme',
  password: 'bjCSRdAOrO7h0YfT',   //  ← paste the exact password you just used in psql
  port:     5432,
});



/* Helper: wrap queries */
const q = (text, params) => pool.query(text, params);

/* ─── Health ping ───────────────────────── */
app.get('/api', (_, res) => res.json({ message: 'Mentor-Me API' }));

/* ─── Roles list (for Admin) ────────────── */
app.get('/api/roles', async (_, res) => {
  try {
    const { rows } = await q('SELECT id, name FROM roles ORDER BY id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'database error' }); }
});

/* ─── Tasks for a role (global + role-specific) ───
   GET /api/roles/:id/tasks
   Picks tasks where:
     • task has NO entry in role_tasks  (global) OR
     • task has an entry with role_id = :id
*/
app.get('/api/roles/:id/tasks', async (req, res) => {
  const roleId = Number(req.params.id);
  try {
    const { rows } = await q(
      `SELECT t.*
         FROM tasks t
         LEFT JOIN role_tasks rt ON rt.task_id = t.id
        WHERE rt.role_id = $1
           OR NOT EXISTS (SELECT 1 FROM role_tasks WHERE task_id = t.id)
        GROUP BY t.id
        ORDER BY t.week_num, t.id`,
      [roleId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'database error' }); }
});

/* ─── Create task (with metadata) ───────── */
app.post('/api/tasks', async (req, res) => {
  let { title, week_num, category, format, assigned_to, resource_url } = req.body;

  if (!title || week_num === undefined || week_num === '' ||
      !category || !format || !assigned_to) {
    return res.status(400).json({ error: 'missing required fields' });
  }

  week_num = parseInt(week_num, 10);
  if (Number.isNaN(week_num) || week_num < 1) {
    return res.status(400).json({ error: 'week_num must be 1-12' });
  }

  console.log('⮕  INSERT', { title, week_num, category, format, assigned_to });

  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks
         (title, week_num, category, format, assigned_to, resource_url)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id`,
      [title, week_num, category, format, assigned_to, resource_url || null]
    );
    return res.status(201).json({ task_id: rows[0].id });
  } catch (err) {
    console.error('❌  PG ERROR:', err.message, '\n', err.stack);   //  ← this line
    return res.status(500).json({ error: 'database error', detail: err.message });
  }
});


/* ─── Map task → roles (many-to-many) ────
   Body: { task_id: 7, role_ids: [1,2,3] }
*/
app.post('/api/role_tasks', async (req, res) => {
  const { task_id, role_ids } = req.body;
  if (!task_id || !Array.isArray(role_ids) || role_ids.length === 0) {
    return res.status(400).json({ error: 'task_id and role_ids[] required' });
  }

  const values = role_ids.map((_, i) => `($1, $${i + 2})`).join(',');
  const params = [task_id, ...role_ids];

  try {
    await q(
      `INSERT INTO role_tasks (task_id, role_id)
       VALUES ${values}
       ON CONFLICT DO NOTHING`,
      params
    );
    res.status(201).json({ ok: true, rows: role_ids.length });
  } catch (err) { res.status(500).json({ error: 'database error' }); }
});

/* ─── Task progress list for a user ─────── */
app.get('/api/tasks/progress', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id query param required' });

  try {
    const { rows } = await q(
      'SELECT task_id, completed FROM task_progress WHERE user_id = $1',
      [user_id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'database error' }); }
});

/* ─── Mark / unmark task progress ───────── */
app.post('/api/tasks/:id/progress', async (req, res) => {
  const taskId = Number(req.params.id);
  const { user_id, completed } = req.body;

  try {
    const { rows } = await q(
      `INSERT INTO task_progress (user_id, task_id, completed, completed_on)
       VALUES ($1,$2,$3, CASE WHEN $3 THEN NOW() ELSE NULL END)
       ON CONFLICT (user_id, task_id)
       DO UPDATE SET completed = EXCLUDED.completed,
                     completed_on = CASE WHEN EXCLUDED.completed THEN NOW() ELSE NULL END
       RETURNING *`,
      [user_id, taskId, completed]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'database error' }); }
});
app.post('/api/tasks', async (req, res) => {
  /* …same guard & INSERT … */
  try {
    const { rows } = await pool.query(/* INSERT … */);
    return res.status(201).json({ task_id: rows[0].id });
  } catch (err) {
    /* NEW: full detail */
    console.error('❌  PG ERROR:', err.message, '\n', err.stack);
    return res.status(500).json({ error: 'database error', detail: err.message });
  }
});

/* ─── launch server ─────────────────────── */
const PORT = process.env.PORT || 5000;
/* GET /api/tasks/all  – tasks plus roles */
app.get('/api/tasks/all', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT  t.id,
              t.title,
              t.week_num,
              t.category,
              t.format,
              t.assigned_to,
              t.resource_url,
              COALESCE(
                STRING_AGG(r.name, ', ' ORDER BY r.name),
                'Global'
              ) AS roles
      FROM tasks t
      LEFT JOIN role_tasks rt ON rt.task_id = t.id
      LEFT JOIN roles       r  ON r.id      = rt.role_id
      GROUP BY t.id
      ORDER BY t.week_num, t.id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'database error' });
  }
});

/* DELETE /api/tasks/:id – remove a task + its mappings/progress */
app.delete('/api/tasks/:id', async (req, res) => {
  const taskId = Number(req.params.id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    /* remove progress rows */
    await client.query('DELETE FROM task_progress WHERE task_id = $1', [taskId]);
    /* remove role mappings */
    await client.query('DELETE FROM role_tasks   WHERE task_id = $1', [taskId]);
    /* finally delete the task itself */
    await client.query('DELETE FROM tasks        WHERE id      = $1', [taskId]);

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'database error' });
  } finally {
    client.release();
  }
});
/* UPDATE a task */
app.put('/api/tasks/:id', async (req, res) => {
  const id = Number(req.params.id);
  const {
    title,
    week_num,
    category,
    format,
    assigned_to,
    resource_url,
  } = req.body;

  try {
    await pool.query(
      `UPDATE tasks
          SET title        = $1,
              week_num     = $2,
              category     = $3,
              format       = $4,
              assigned_to  = $5,
              resource_url = $6
        WHERE id = $7`,
      [title, week_num, category, format, assigned_to, resource_url || null, id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'database error' });
  }
});
/* ───── USER ROUTES ────────────────────────── */

/* list users */
app.get('/api/users', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, r.name AS role
         FROM users u
         LEFT JOIN roles r ON r.id = u.role_id
        ORDER BY u.id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'database error' });
  }
});

/* create user */
app.post('/api/users', async (req, res) => {
  const { name, email, role_id } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO users(name,email,role_id)
       VALUES ($1,$2,$3) RETURNING *`,
      [name, email, role_id || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'database error' });
  }
});

/* update user */
app.put('/api/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, role_id } = req.body;
  try {
    await pool.query(
      `UPDATE users SET name=$1, email=$2, role_id=$3 WHERE id=$4`,
      [name, email, role_id || null, id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'database error' });
  }
});

/* delete user + their progress */
app.delete('/api/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM task_progress WHERE user_id=$1', [id]);
    await client.query('DELETE FROM users          WHERE id=$1',     [id]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'database error' });
  } finally {
    client.release();
  }
});
/* PROGRESS SUMMARY ───────────────────────────
   GET /api/users/:id/progress_summary
   Response shape:
   {
     total_tasks: 36,
     completed_tasks: 12,
     weeks: [ { week_num:1,total:5,done:3 }, … ],
     tasks: [
       {
         id, title, week_num,
         completed, completed_at     // may be null
       }, …
     ]
   }
*/
app.get('/api/users/:id/progress_summary', async (req, res) => {
  const uid = Number(req.params.id);
  try {
    /* 1 ─ total vs completed counts */
    const [{ total_tasks }]     = (await pool.query('SELECT COUNT(*)::int AS total_tasks FROM tasks')).rows;
    const [{ completed_tasks }] = (await pool.query(
      'SELECT COUNT(*)::int AS completed_tasks FROM task_progress WHERE user_id=$1 AND completed',
      [uid]
    )).rows;

    /* 2 ─ per-week roll-up */
    const weekRows = (await pool.query(
      `SELECT t.week_num,
              COUNT(*)::int              AS total,
              COUNT(p.*)::int            AS done
         FROM tasks t
         LEFT JOIN task_progress p
           ON p.task_id=t.id AND p.user_id=$1 AND p.completed
        GROUP BY t.week_num
        ORDER BY t.week_num`,
      [uid]
    )).rows;

    /* 3 ─ detailed task list for the modal table */
    const taskRows = (await pool.query(
      `SELECT t.id, t.title, t.week_num,
              COALESCE(p.completed,false)        AS completed,
              p.completed_at
         FROM tasks t
         LEFT JOIN task_progress p
           ON p.task_id=t.id AND p.user_id=$1
        ORDER BY t.week_num, t.id`,
      [uid]
    )).rows;

    res.json({
      total_tasks,
      completed_tasks,
      weeks: weekRows,
      tasks: taskRows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'database error' });
  }
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
