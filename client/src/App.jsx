import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import Banner     from './components/Banner';
import Navbar     from './components/Navbar';
import Landing    from './components/Landing';
import MyProgress from './components/MyProgress';
import Checklist  from './components/Checklist';
import MyChecklists  from './components/MyChecklists';
import Dashboard  from './components/Dashboard';
import Login      from './components/Login';

import { AuthProvider }       from './AuthContext';
import ProtectedRoute         from './components/ProtectedRoute';

/* 🔍 shared search context */
export const SearchContext = React.createContext({
  search: '',
  setSearch: () => {},
});

export default function App() {
  const [search, setSearch] = useState('');
  const { pathname } = useLocation();

  /* read token directly; AuthProvider will keep it in sync */
  const token = localStorage.getItem('token');
  const showNav = !!token && pathname !== '/login';

  return (
    <AuthProvider>
      <SearchContext.Provider value={{ search, setSearch }}>
        <Banner />
        {showNav && <Navbar />}

        {/* Banner (48 px) + Navbar (64 px) = 112 px ⇒ pt-28 */}
        <div className="pt-28">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/checklists"          element={<MyChecklists />} />
            <Route path="/checklists/:id"      element={<Checklist />} />
            <Route path="/" element={<Landing />} />

            <Route
              path="/checklist"
              element={
                <ProtectedRoute>
                  <Checklist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my"
              element={
                <ProtectedRoute>
                  <MyProgress />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </SearchContext.Provider>
    </AuthProvider>
  );
}
