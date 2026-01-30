/**
 * Skeleton Component
 * Loading placeholder components for better UX during data fetching
 */

import React from 'react';

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
    animate-pulse bg-neutral-200
    ${circle ? 'rounded-full' : 'rounded-md'}
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
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton key={index} height={16} width={index === lines - 1 && lines > 1 ? '75%' : '100%'} />
    ))}
  </div>
);

/**
 * Avatar Skeleton
 * Placeholder for avatar images
 */
export const SkeletonAvatar: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 56,
  };

  return <Skeleton circle width={sizes[size]} height={sizes[size]} className={className} />;
};

/**
 * Table Row Skeleton
 * Placeholder for table rows
 */
export const SkeletonTableRow: React.FC<{
  columns?: number;
  className?: string;
}> = ({ columns = 5, className = '' }) => (
  <div className={`flex items-center gap-4 py-4 px-6 border-b border-border-default ${className}`}>
    {Array.from({ length: columns }).map((_, index) => (
      <div key={index} className="flex-1">
        <Skeleton height={16} width={index === 0 ? '60%' : '80%'} />
      </div>
    ))}
  </div>
);

/**
 * Card Skeleton
 * Placeholder for card components
 */
export const SkeletonCard: React.FC<{
  className?: string;
  showAvatar?: boolean;
  lines?: number;
}> = ({ className = '', showAvatar = true, lines = 3 }) => (
  <div className={`bg-surface-default rounded-md border border-border-default shadow-sm p-4 ${className}`}>
    <div className="flex items-start gap-4">
      {showAvatar && <SkeletonAvatar size="md" />}
      <div className="flex-1">
        <Skeleton height={20} width="40%" className="mb-2" />
        <SkeletonText lines={lines} />
      </div>
    </div>
  </div>
);

/**
 * List Skeleton
 * Placeholder for list views
 */
export const SkeletonList: React.FC<{
  rows?: number;
  className?: string;
}> = ({ rows = 5, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex items-center gap-4">
        <SkeletonAvatar size="sm" />
        <div className="flex-1">
          <Skeleton height={16} width="30%" className="mb-2" />
          <Skeleton height={12} width="60%" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Page Skeleton
 * Full page loading placeholder
 */
export const SkeletonPage: React.FC<{
  className?: string;
}> = ({ className = '' }) => (
  <div className={`p-6 space-y-6 ${className}`}>
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton height={32} width={200} />
      <Skeleton height={40} width={140} />
    </div>

    {/* Filters */}
    <div className="flex gap-4">
      <Skeleton height={40} width={300} />
      <Skeleton height={40} width={150} />
      <Skeleton height={40} width={150} />
    </div>

    {/* Table */}
    <div className="bg-surface-default rounded-md border border-border-default shadow-sm">
      {/* Table header */}
      <div className="flex items-center gap-4 py-3 px-6 border border-border-default border-b bg-surface-canvas">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex-1">
            <Skeleton height={12} width="60%" />
          </div>
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: 8 }).map((_, index) => (
        <SkeletonTableRow key={index} columns={6} />
      ))}
    </div>
  </div>
);
