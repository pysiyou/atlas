// src/components/loaders/SpinnerLoader.tsx
/**
 * SpinnerLoader — conic-gradient ring with a soft trailing fade.
 * Theme-aware via currentColor; GPU rotation only.
 */

import React, { useMemo } from 'react';
import { cn } from '@/utils/cn';

interface SizeConfig {
  size: number;
  strokeWidth: number;
}

const SIZES: Record<string, SizeConfig> = {
  xs: { size: 16, strokeWidth: 2 },
  sm: { size: 24, strokeWidth: 2.5 },
  md: { size: 36, strokeWidth: 3 },
  lg: { size: 48, strokeWidth: 3.5 },
};

export type SpinnerLoaderSize = keyof typeof SIZES;

export interface SpinnerLoaderProps {
  size?: SpinnerLoaderSize;
  className?: string;
}

function ringMask(strokeWidth: number): React.CSSProperties {
  const mask = `radial-gradient(farthest-side, transparent calc(100% - ${strokeWidth}px), #000 calc(100% - ${strokeWidth}px))`;
  return {
    WebkitMask: mask,
    mask,
  };
}

export const SpinnerLoader: React.FC<SpinnerLoaderProps> = ({ size = 'md', className = '' }) => {
  const { size: diameter, strokeWidth } = SIZES[size] ?? SIZES.md;

  const sweepStyle = useMemo(
    () => ({
      ...ringMask(strokeWidth),
      background: `conic-gradient(
        from 0deg,
        transparent 0deg,
        color-mix(in srgb, currentColor 18%, transparent) 40deg,
        currentColor 95deg,
        color-mix(in srgb, currentColor 35%, transparent) 150deg,
        transparent 230deg,
        transparent 360deg
      )`,
    }),
    [strokeWidth],
  );

  const trackStyle = useMemo(
    () => ({
      ...ringMask(strokeWidth),
      background: 'currentColor',
      opacity: 0.12,
    }),
    [strokeWidth],
  );

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('relative inline-flex shrink-0 items-center justify-center text-current', className)}
      style={{ width: diameter, height: diameter }}
    >
      <div aria-hidden className="absolute inset-0 rounded-full" style={trackStyle} />
      <div
        aria-hidden
        className={cn(
          'absolute inset-0 rounded-full',
          'animate-spin motion-reduce:animate-none motion-reduce:opacity-90',
          '[animation-duration:1.05s] [animation-timing-function:cubic-bezier(0.4,0,0.2,1)]',
        )}
        style={sweepStyle}
      />
    </div>
  );
};
