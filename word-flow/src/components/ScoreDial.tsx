import React from 'react';
import { motion } from 'motion/react';

interface ScoreDialProps {
  score: number;
}

export function ScoreDial({ score }: ScoreDialProps) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = '#ef4444'; // red-500
  if (score >= 76) {
    strokeColor = '#22c55e'; // green-500
  } else if (score >= 41) {
    strokeColor = '#eab308'; // yellow-500
  }

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="transparent"
          stroke="#f3f4f6" // gray-100
          strokeWidth="12"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth="12"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <motion.span 
          className="text-5xl font-bold tabular-nums tracking-tighter text-gray-900"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-sm font-medium text-gray-500 uppercase tracking-widest mt-1">
          Score
        </span>
      </div>
    </div>
  );
}
