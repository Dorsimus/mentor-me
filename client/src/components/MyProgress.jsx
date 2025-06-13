import React, { useContext, useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts';
import MentorChat from './MentorChat';            /* ← import */
import { AuthContext } from '../AuthContext';

/* ... component code exactly as provided ... */

export default function MyProgress() {
  /* ... existing hooks and render ... */

  return (
    <div className="max-w-xl mx-auto mt-8 space-y-8">
      {/* greeting, donut, week bars, up-next list */}
      <MentorChat />
    </div>
  );
}
