/**
 * DonutChartSkeleton - Loading placeholder for the Lab pipeline donut chart.
 * Matches DonutChart layout: chart area (ring + segment labels) + detail list section.
 */

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

const SEGMENT_ROWS = 4;
const LIST_ROWS = 4;

export const DonutChartSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`flex flex-col h-full w-full min-w-0 min-h-0 bg-surface rounded overflow-hidden shadow-sm ${className}`}
    aria-busy="true"
    aria-label="Loading chart"
  >
    <div className="flex-1 min-h-[200px] min-w-0 flex flex-row overflow-hidden">
      {/* Chart area ~52%: center ring + segment labels */}
      <div className="shrink-0 flex flex-col min-w-0" style={{ width: '52%' }}>
        <div className="flex-1 min-h-0 relative flex items-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <Skeleton circle width={120} height={120} className="opacity-90" />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface"
                style={{ width: '44%', height: '44%', minWidth: 40, minHeight: 40 }}
                aria-hidden
              />
            </div>
          </div>
        </div>
        <div className="shrink-0 px-2 pb-2 grid grid-cols-2 gap-x-4 gap-y-1.5 justify-items-start">
          {Array.from({ length: SEGMENT_ROWS }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5 w-full min-w-0">
              <Skeleton circle width={8} height={8} className="shrink-0" />
              <Skeleton height={12} width={i % 2 === 0 ? '60%' : '50%'} />
              <Skeleton height={10} width={24} className="shrink-0" />
            </div>
          ))}
        </div>
      </div>
      {/* Detail list section */}
      <div className="flex-1 min-w-0 flex flex-col border-l border-border-default overflow-hidden">
        <div className="shrink-0 flex flex-col py-2 pr-3 pl-3 overflow-y-auto">
          {Array.from({ length: LIST_ROWS }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-3 min-w-0 border-b border-border-default last:border-b-0"
            >
              <Skeleton width={36} height={36} className="rounded-md shrink-0" />
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <Skeleton height={14} width="70%" />
                <Skeleton height={12} width="90%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
