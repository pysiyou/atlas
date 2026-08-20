// src/components/loaders/SpinnerLoader.tsx
/**
 * SpinnerLoader – Modern circular loading spinner.
 *
 * A clean, minimalist spinner with a rotating arc animation.
 * Uses pure CSS transforms for optimal performance.
 * Supports multiple sizes and respects reduced motion preferences.
 */

import React from 'react';

/**
 * Size configuration for the spinner
 * - size: outer diameter of the spinner circle
 * - strokeWidth: thickness of the spinner arc
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
/** @deprecated Use SpinnerLoaderSize */
export type DnaHelixLoaderSize = SpinnerLoaderSize;

export interface SpinnerLoaderProps {
  /** Size of the spinner */
  size?: SpinnerLoaderSize;
  /** Additional CSS classes */
  className?: string;
}
/** @deprecated Use SpinnerLoaderProps */
export type DnaHelixLoaderProps = SpinnerLoaderProps;

/**
 * SpinnerLoader Component
 *
 * Renders a modern circular spinner with a rotating arc animation.
 * The animation is GPU-accelerated for smooth 60fps performance.
 *
 * @example
 * ```tsx
 * <SpinnerLoader size="md" />
 * ```
 */
export const SpinnerLoader: React.FC<SpinnerLoaderProps> = ({ size = 'md', className = '' }) => {
  const { size: diameter, strokeWidth } = SIZES[size] ?? SIZES.md;
  const radius = (diameter - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Calculate the stroke-dasharray for a 3/4 arc
  const arcLength = circumference * 0.75;
  const gapLength = circumference * 0.25;

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
        style={{
          animation: 'spin 0.8s linear infinite',
        }}
      >
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @media (prefers-reduced-motion: reduce) {
            svg {
              animation-play-state: paused !important;
            }
          }
        `}</style>
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${gapLength}`}
          opacity="0.9"
          style={{
            transformOrigin: 'center',
          }}
        />
      </svg>
    </div>
  );
};

/** @deprecated Use SpinnerLoader */
export const DnaHelixLoader = SpinnerLoader;
