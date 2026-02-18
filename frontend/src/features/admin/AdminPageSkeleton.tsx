/**
 * AdminPageSkeleton - Loading placeholder for Administration page.
 * Mirrors Admin: title, 4 stat cards, Test Catalog section with table.
 */

import React from 'react';
import { SectionContainer } from '@/components/ui';
import { SkeletonCard, SkeletonTableRow } from '@/components/ui/Skeleton';

const STAT_CARDS = 4;
const TABLE_ROWS = 6;
const TABLE_COLUMNS = 5;

export const AdminPageSkeleton: React.FC = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading administration">
    <div className="h-8 w-48 animate-pulse bg-neutral-200 rounded-md" />

    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Array.from({ length: STAT_CARDS }).map((_, i) => (
        <SkeletonCard key={i} showAvatar={false} lines={2} />
      ))}
    </div>

    <SectionContainer title="Test Catalog">
      <div className="h-4 w-24 animate-pulse bg-neutral-200 rounded mb-3" />
      <div className="border-t border-border-default">
        {Array.from({ length: TABLE_ROWS }).map((_, i) => (
          <SkeletonTableRow key={i} columns={TABLE_COLUMNS} />
        ))}
      </div>
    </SectionContainer>
  </div>
);
