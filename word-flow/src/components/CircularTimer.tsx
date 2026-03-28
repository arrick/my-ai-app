import React from 'react';

interface CircularTimerProps {
  secondsLeft: number;
  totalSeconds: number;
}

export function CircularTimer({ secondsLeft, totalSeconds }: CircularTimerProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (secondsLeft / totalSeconds) * circumference;

  // Color transition from green to yellow to red
  let strokeColor = '#22c55e'; // green-500
  if (secondsLeft <= 15) {
    strokeColor = '#ef4444'; // red-500
  } else if (secondsLeft <= 30) {
    strokeColor = '#eab308'; // yellow-500
  }

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="#e5e7eb" // gray-200
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums tracking-tighter text-gray-800">
          {secondsLeft}
        </span>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          sec
        </span>
      </div>
    </div>
  );
}
