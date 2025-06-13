import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext({
  user:   null,
  token:  null,
  login:  () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  /* keep user in sync if token already exists */
  useEffect(() => {
    if (!token) return;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => {
        setToken(null);
        localStorage.removeItem('token');
      });
  }, [token]);

  const login  = (u, t) => {
    setUser(u);
    setToken(t);
    localStorage.setItem('token', t);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
