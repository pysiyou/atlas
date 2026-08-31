// src/components/loaders/SpinnerLoader.tsx
/**
 * SpinnerLoader – Modern dual-ring loading spinner.
 *
 * A stylish spinner with two rotating arcs creating a dynamic visual.
 * Uses pure CSS transforms for optimal performance.
 * Supports multiple sizes and respects reduced motion preferences.
 */

import React from 'react';

/**
 * Size configuration for the spinner
 * - size: outer diameter of the spinner circle
 * - strokeWidth: thickness of the spinner arcs
 */
interface SizeConfig {
  size: number;
  strokeWidth: number;
}

const SIZES: Record<string, SizeConfig> = {
  xs: { size: 16, strokeWidth: 2.5 },
  sm: { size: 24, strokeWidth: 3 },
  md: { size: 36, strokeWidth: 3.5 },
  lg: { size: 48, strokeWidth: 4 },
};

export type SpinnerLoaderSize = keyof typeof SIZES;

export interface SpinnerLoaderProps {
  /** Size of the spinner */
  size?: SpinnerLoaderSize;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SpinnerLoader Component
 *
 * Renders a modern dual-ring spinner with counter-rotating arcs.
 * The animation is GPU-accelerated for smooth 60fps performance.
 *
 * @example
 * ```tsx
 * <SpinnerLoader size="md" />
 * ```
 */
export const SpinnerLoader: React.FC<SpinnerLoaderProps> = ({ size = 'md', className = '' }) => {
  const { size: diameter, strokeWidth } = SIZES[size] ?? SIZES.md;
  const radius = (diameter - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Outer arc - 60% of circle
  const outerArcLength = circumference * 0.6;
  const outerGapLength = circumference * 0.4;
  
  // Inner arc - 40% of circle, offset
  const innerRadius = radius * 0.7;
  const innerCircumference = innerRadius * 2 * Math.PI;
  const innerArcLength = innerCircumference * 0.4;
  const innerGapLength = innerCircumference * 0.6;

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        width: diameter,
        height: diameter,
      }}
    >
      <svg
        width={diameter}
        height={diameter}
        viewBox={`0 0 ${diameter} ${diameter}`}
        xmlns="http://www.w3.org/2000/svg"
        className="text-current"
      >
        <style>{`
          @keyframes spin-outer {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes spin-inner {
            from { transform: rotate(0deg); }
            to { transform: rotate(-360deg); }
          }
          @media (prefers-reduced-motion: reduce) {
            .spinner-outer, .spinner-inner {
              animation-play-state: paused !important;
            }
          }
        `}</style>
        
        {/* Outer arc - clockwise rotation */}
        <circle
          className="spinner-outer"
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${outerArcLength} ${outerGapLength}`}
          opacity="0.85"
          style={{
            transformOrigin: 'center',
            animation: 'spin-outer 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          }}
        />
        
        {/* Inner arc - counter-clockwise rotation */}
        <circle
          className="spinner-inner"
          cx={diameter / 2}
          cy={diameter / 2}
          r={innerRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth * 0.9}
          strokeLinecap="round"
          strokeDasharray={`${innerArcLength} ${innerGapLength}`}
          opacity="0.5"
          style={{
            transformOrigin: 'center',
            animation: 'spin-inner 1s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          }}
        />
      </svg>
    </div>
  );
};
