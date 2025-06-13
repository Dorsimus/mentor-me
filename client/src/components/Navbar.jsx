import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ListChecks, BarChartBig } from 'lucide-react';

import SearchBox         from './SearchBox';
import { SearchContext } from '../App';
import { AuthContext }   from '../AuthContext';

export default function Navbar() {
  const { pathname }            = useLocation();
  const { search, setSearch }   = useContext(SearchContext);
  const { user, token, logout } = useContext(AuthContext);

  const isAdmin  = !!user?.is_admin;
  const signedIn = !!token;

  /* decide where Home should point */
  const homePath = signedIn
    ? isAdmin ? '/dashboard' : '/checklist'
    : '/';

  /* ordered nav list with unique React keys */
  const navItems = [
    { key: 'home',      to: homePath,      label: 'Home',      Icon: Home },
    { key: 'checklist', to: '/checklist',  label: 'Checklist', Icon: ListChecks },
    ...(isAdmin ? [
      { key: 'dashboard', to: '/dashboard', label: 'Dashboard', Icon: BarChartBig },
    ] : []),
  ];

  return (
    <nav className="fixed inset-x-0 top-12 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 z-40">
      <div className="max-w-6xl mx-auto flex h-full items-center px-6 gap-10 relative">
        {navItems.map(({ key, to, label, Icon }) => {
          const active = pathname === to;
          return (
            <NavLink
              key={key}          /* <-- guaranteed unique */
              to={to}
              className="group relative flex items-center gap-2 font-medium text-gray-700 hover:text-blue-600"
            >
              <Icon size={20} className="shrink-0" />
              <span>{label}</span>

              {active && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute left-0 -bottom-1 h-0.5 w-full rounded bg-blue-600"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}

        {/* right side */}
        <div className="ml-auto flex items-center gap-4">
          {pathname === '/checklist' && (
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search tasks…"
            />
          )}

          {signedIn && (
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
