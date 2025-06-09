import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';

import Banner    from './components/Banner';
import Navbar    from './components/Navbar';
import Landing   from './components/Landing';
import Checklist from './components/Checklist';
import Admin     from './components/Admin';
import Dashboard from './components/Dashboard';   // ← make sure this import is here!
import Users     from './components/DashboardUsers';

/* search context for Navbar + Checklist */
export const SearchContext = React.createContext({
  search: '',
  setSearch: () => {},
});

export default function App() {
  const [search, setSearch] = useState('');

  return (
    <SearchContext.Provider value={{ search, setSearch }}>
      <Banner />
      <Navbar />

      {/* 48 px banner + 64 px navbar = 112 px → pt-28 */}
      <div className="pt-28">
        <Routes>
          <Route path="/"           element={<Landing   />} />
          <Route path="/checklist"  element={<Checklist />} />
          <Route path="/dashboard"  element={<Dashboard />} />  {/* ← THIS route */}
        </Routes>
      </div>
    </SearchContext.Provider>
  );
}
