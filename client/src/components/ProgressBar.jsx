import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import Confetti from 'react-confetti';

/* Milestones (100 % label hidden until reached) */
const marks = [25, 50, 75, 100];

export default function ProgressBar({ completed, total, height = 8 }) {
  /* percent filled */
  const pct = total ? (completed / total) * 100 : 0;

  /* one animation controller per milestone */
  const controls = useRef(marks.map(() => useAnimation())).current;

  /* confetti state + run-limit counter */
  const [party, setParty] = useState(false);
  const runs = useRef(0); // allow max 2 confetti runs

  /* trigger pops + (max-2) confetti */
  useEffect(() => {
    marks.forEach((mark, i) => {
      if (pct >= mark) controls[i].start('popped');
    });

    if (pct >= 100 && runs.current < 2) {
      runs.current += 1;            // count this blast
      setParty(true);
      setTimeout(() => setParty(false), 4000); // confetti lasts 4 s
    }
  }, [pct, controls]);

  return (
    <div
      className="relative w-full bg-gray-200 rounded"
      style={{ height }}                 /* slim track height */
    >
      {/* filled segment */}
      <div
        className="absolute inset-y-0 left-0 bg-blue-600 rounded transition-all duration-300"
        style={{ width: `${pct}%` }}
      />

      {/* ticks + animated labels */}
      {marks.map((mark, i) => (
        <React.Fragment key={mark}>
          {/* tick line */}
          <div
            className="absolute inset-y-0 w-0.5 bg-gray-400"
            style={{ left: `${mark}%` }}
          />

          {/* label (100 % hidden until reached) */}
          {(mark < 100 || pct >= 100) && (
            <motion.span
              className="absolute -translate-x-1/2 top-full mt-1 text-xs font-semibold text-gray-600 select-none"
              style={{ left: `${mark}%` }}
              initial={{ scale: 0, opacity: 0 }}
              variants={{
                popped: {
                  scale: [1, 1.8, 1],
                  opacity: [0, 1, 1],
                  transition: { duration: 0.6, ease: 'easeOut' },
                },
              }}
              animate={controls[i]}
            >
              {mark}%
            </motion.span>
          )}
        </React.Fragment>
      ))}

      {/* one-second confetti blast (max twice) */}
      {party && <Confetti numberOfPieces={180} recycle={false} />}
    </div>
  );
}
