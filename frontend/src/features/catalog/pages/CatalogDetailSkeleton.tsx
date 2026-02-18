/**
 * CatalogDetailSkeleton - Loading placeholder for catalog test detail.
 * Mirrors BalancedDetailsLayout: section blocks with label/value rows.
 */

import React from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { SkeletonInfoSection } from '@/components/ui/Skeleton';

const SECTIONS = [
  { title: 'Test Overview', rows: 8 },
  { title: 'Sample Requirements', rows: 8 },
  { title: 'Pricing & Status', rows: 4 },
];

export const CatalogDetailSkeleton: React.FC = () => {
  const breakpoint = useBreakpoint();
  const columns =
    breakpoint === 'xs' || breakpoint === 'sm' ? 1 : breakpoint === 'md' ? 2 : 3;

  return (
    <div
      className="grid gap-4 pb-6"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      aria-busy="true"
      aria-label="Loading test details"
    >
      {SECTIONS.map(section => (
        <div
          key={section.title}
          className="bg-surface border border-border-default rounded-md overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border-default bg-surface-page">
            <div className="h-3 w-24 animate-pulse bg-neutral-200 rounded-md" />
          </div>
          <div className="p-4">
            <SkeletonInfoSection rows={section.rows} layout="column" />
          </div>
        </div>
      ))}
    </div>
  );
};
