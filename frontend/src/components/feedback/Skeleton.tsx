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

/**
 * Text Skeleton
 * Placeholder for text content
 */
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 1, className = '' }) => (
  <div className={`space-y-space-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton key={index} height={16} width={index === lines - 1 && lines > 1 ? '75%' : '100%'} />
    ))}
  </div>
);

/**
 * Table Row Skeleton
 * Placeholder for table rows
 */
export const SkeletonTableRow: React.FC<{
  columns?: number;
  className?: string;
}> = ({ columns = 5, className = '' }) => (
  <div className={`flex items-center gap-layout-section py-space-4 px-table-cell-x-default border-b border-border-default ${className}`}>
    {Array.from({ length: columns }).map((_, index) => (
      <div key={index} className="flex-1">
        <Skeleton height={16} width={index === 0 ? '60%' : '80%'} />
      </div>
    ))}
  </div>
);

/**
 * Info section skeleton – label/value rows (e.g. General Info, Order Info).
 */
export const SkeletonInfoSection: React.FC<{
  rows?: number;
  layout?: 'grid' | 'column';
  className?: string;
}> = ({ rows = 5, layout = 'column', className = '' }) => {
  const containerClass =
    layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-layout-stack' : 'flex flex-col gap-space-3';
  return (
    <div className={`${containerClass} ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-col gap-space-1">
          <Skeleton height={10} width={64} />
          <Skeleton height={14} width={i % 2 === 0 ? '85%' : '70%'} />
        </div>
      ))}
    </div>
  );
};
