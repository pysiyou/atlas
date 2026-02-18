/**
 * ActivitiesTimelineSkeleton - Loading placeholder for the activities timeline.
 * Mirrors timeline structure: date dividers + activity rows (dot + content lines).
 */

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

const DATE_GROUPS = 2;
const ITEMS_PER_GROUP = 3;

export const ActivitiesTimelineSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`flex flex-col h-full bg-surface ${className}`}
    aria-busy="true"
    aria-label="Loading activities"
  >
    <div className="flex-1 overflow-auto scroll-smooth">
      {Array.from({ length: DATE_GROUPS }).map((_, groupIndex) => (
        <section key={groupIndex} className="px-4 pb-6 first:pt-1">
          <div className="flex items-center gap-3 py-3 sticky top-0 z-1 bg-surface/95 backdrop-blur-[2px]">
            <div className="flex-1 h-px bg-stroke/80 min-w-0" />
            <Skeleton height={10} width={48} className="shrink-0" />
            <div className="flex-1 h-px bg-stroke/80 min-w-0" />
          </div>
          <div className="relative">
            <div
              className="absolute top-4 bottom-4 w-px bg-linear-to-b from-stroke via-stroke/60 to-stroke pointer-events-none"
              aria-hidden
              style={{ left: '5px', transform: 'translateX(-50%)' }}
            />
            <ul className="space-y-0 list-none">
              {Array.from({ length: ITEMS_PER_GROUP }).map((_, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-3 relative">
                  <div className="w-[10px] flex justify-center shrink-0 z-10 pt-[7px]">
                    <Skeleton circle width={8} height={8} className="ring-2 ring-surface" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5 pb-4">
                    <div className="space-y-1">
                      <Skeleton height={14} width="85%" />
                      <Skeleton height={12} width="60%" />
                    </div>
                    <Skeleton height={10} width={72} className="mt-1.5" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
    </div>
  </div>
);
