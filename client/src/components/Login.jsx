import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

/**
 * When rendered inside a modal, pass `compact`
 *   <Login compact />
 * Otherwise it renders full-screen on /login
 */
export default function Login({ compact = false }) {
  const { login } = useContext(AuthContext);
  const navigate  = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setErr]  = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) return setErr('Invalid credentials');

    const { token, user } = await res.json();
    login(user, token);
    navigate('/checklist', { replace: true });
  }

  /* form JSX reused in both modes */
  const formCard = (
    <form onSubmit={submit} className="w-full max-w-sm bg-white p-6 rounded shadow space-y-4">
      <h1 className="text-xl font-semibold text-center">Sign in</h1>

      <input
        type="email"
        placeholder="Email"
        required
        className="w-full border rounded px-3 py-2"
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
      />
      <input
        type="password"
        placeholder="Password"
        required
        className="w-full border rounded px-3 py-2"
        value={form.password}
        onChange={e => setForm({ ...form, password: e.target.value })}
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        Log in
      </button>
    </form>
  );

  return compact ? (
    formCard
  ) : (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {formCard}
    </div>
  );
}
