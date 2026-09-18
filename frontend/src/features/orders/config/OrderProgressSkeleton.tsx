import React from 'react';
import { RADIUS } from '@/components/theme/recipes';
import { Skeleton } from '@/components/loaders/Skeleton';

const TIMELINE_STEPS = 4;

export const OrderProgressSkeleton: React.FC = () => (
  <div className="relative">
    <div
      className="absolute top-space-4 bottom-space-4 w-px bg-linear-to-b from-stroke via-stroke/60 to-stroke pointer-events-none left-[9px]"
      aria-hidden
    />
    <ul className="space-y-0 list-none">
      {Array.from({ length: TIMELINE_STEPS }).map((_, i) => (
        <li key={i} className="flex items-start gap-space-3 relative">
          <div className={`w-5 h-5 shrink-0 ${RADIUS.pill} border-2 border-border-default bg-surface z-10 mt-space-0-5`} />
          <div className="flex-1 min-w-0 pt-space-0-5 pb-space-4">
            <Skeleton height={14} width="70%" className="mb-space-1" />
            <Skeleton height={12} width="50%" />
          </div>
        </li>
      ))}
    </ul>
  </div>
);
