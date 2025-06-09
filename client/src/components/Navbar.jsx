import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ListChecks, Users as UsersIcon } from 'lucide-react';
import { BarChartBig } from 'lucide-react';   // icon for dashboard
import SearchBox from './SearchBox';
import { SearchContext } from "../App";               // 🔍 tiny input component

/* links & icons */
const navItems = [
  { to: '/',         label: 'Home',      Icon: Home        },
  { to: '/checklist',label: 'Checklist', Icon: ListChecks  },
  { to: '/dashboard',label: 'Dashboard', Icon: BarChartBig },
  ];

export default function Navbar() {
  const { pathname } = useLocation();
  const { search, setSearch } = useContext(SearchContext);         // local search value

  return (
    <nav className="fixed inset-x-0 top-12 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 z-40">
      <div className="max-w-6xl mx-auto flex h-full items-center px-6 gap-10 relative">
        {/* navigation links */}
        {navItems.map(({ to, label, Icon }) => {
          const active = pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className="group relative flex items-center gap-2 font-medium text-gray-700 hover:text-blue-600"
            >
              <Icon size={20} className="shrink-0" />
              <span>{label}</span>

              {/* animated underline */}
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

        {/* right-side search ─ shows only on Checklist */}
        <div className="ml-auto flex items-center">
          {pathname === '/checklist' && (
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search tasks…"
            />
          )}
        </div>
      </div>
    </nav>
  );
}
