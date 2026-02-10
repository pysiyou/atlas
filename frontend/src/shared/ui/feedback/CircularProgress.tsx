import React from 'react';

export interface CircularProgressProps {
  /** Size of the circular progress in pixels */
  size?: number;
  /** Width of the stroke in pixels */
  strokeWidth?: number;
  /** Tailwind class for the background track color (e.g. "stroke-gray-200") */
  trackColorClass?: string;
  /** Tailwind class for the progress indicator color (e.g. "stroke-emerald-500") */
  progressColorClass?: string;
  /** Percentage of progress (0-100) */
  percentage: number;
  /** Optional label text or node to display next to the progress */
  label?: React.ReactNode;
  /** Additional CSS class names */
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size = 32,
  strokeWidth = 2,
  trackColorClass = 'stroke-neutral-200',
  progressColorClass = 'stroke-brand',
  percentage,
  label,
  className = '',
}) => {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Circular Progress Bar */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          {/* Background Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            strokeWidth={strokeWidth}
            className={trackColorClass}
          />
          {/* Progress Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={progressColorClass}
          />
        </svg>
      </div>

      {/* Label */}
      {label && <span className="text-fg-subtle text-xs normal-case font-normal">{label}</span>}
    </div>
  );
};
