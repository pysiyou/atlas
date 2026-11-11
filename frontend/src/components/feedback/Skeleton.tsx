/**
 * Skeleton Component
 * Loading placeholder components for better UX during data fetching
 */

import React from 'react';
import { RADIUS } from '@/theme/recipes';

interface SkeletonProps {
  /** Width of the skeleton (CSS value) */
  width?: string | number;
  /** Height of the skeleton (CSS value) */
  height?: string | number;
  /** Whether to use circular shape */
  circle?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Number of skeleton items to render */
  count?: number;
}

/**
 * Base Skeleton Component
 * Renders an animated placeholder element
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  circle = false,
  className = '',
  count = 1,
}) => {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const baseClasses = `
    animate-pulse bg-surface-hover
    ${circle ? RADIUS.pill : RADIUS.surface}
    ${className}
  `.trim();

  if (count === 1) {
    return <div className={baseClasses} style={style} />;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={baseClasses} style={style} />
      ))}
    </>
  );
};
