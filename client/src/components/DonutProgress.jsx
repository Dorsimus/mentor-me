import React from 'react';

/**
 * Donut progress indicator.
 * Props: completed (number), total (number), size (px, default 96)
 */
export default function DonutProgress({ completed, total, size = 96 }) {
  const pct = total ? (completed / total) * 100 : 0;
  const radius = 45;                 // SVG viewBox is 100×100
  const circ   = 2 * Math.PI * radius;
  const dash   = (pct / 100) * circ;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
    >
      {/* track */}
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="#efefef"               /* gray-200 */
        strokeWidth="10"
      />
      {/* progress */}
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="#0127a2"               /* blue-600 */
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        transform="rotate(-90 50 50)"  /* start at 12 o’clock */
      />
      {/* percentage text */}
      <text
        x="50"
        y="55"
        textAnchor="middle"
        fontSize="20"
        className="font-semibold fill-gray-700"
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
}
