/**
 * OrderDetailSkeleton - Loading placeholder for order detail page.
 * Mirrors OrderDetailLayouts: SmallScreenLayout, MediumScreenLayout, LargeScreenLayout.
 */

import React from 'react';
import { useResponsiveLayout } from '@/hooks';
import { SectionContainer } from '@/components/ui';
import { Skeleton, SkeletonInfoSection, SkeletonTableRow } from '@/components/ui/Skeleton';

const INFO_ROWS = 5;
const TABLE_SKELETON_ROWS = 4;
const TIMELINE_STEPS = 4;

/** Placeholder for Order Progress timeline (vertical steps). */
const OrderProgressSkeleton: React.FC = () => (
  <div className="relative">
    <div
      className="absolute top-4 bottom-4 w-px bg-linear-to-b from-stroke via-stroke/60 to-stroke pointer-events-none left-[9px]"
      aria-hidden
    />
    <ul className="space-y-0 list-none">
      {Array.from({ length: TIMELINE_STEPS }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 relative">
          <div className="w-5 h-5 shrink-0 rounded-full border-2 border-border-default bg-surface z-10 mt-0.5" />
          <div className="flex-1 min-w-0 pt-0.5 pb-4">
            <Skeleton height={14} width="70%" className="mb-1" />
            <Skeleton height={12} width="50%" />
          </div>
        </li>
      ))}
    </ul>
  </div>
);

export const OrderDetailSkeleton: React.FC = () => {
  const { isSmall, isMedium } = useResponsiveLayout();

  if (isSmall) {
    return (
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto pb-6 bg-surface-page">
        <SectionContainer title="Order Information" className="shrink-0 bg-surface" contentClassName="overflow-visible">
          <SkeletonInfoSection rows={INFO_ROWS} layout="grid" />
        </SectionContainer>
        <SectionContainer title="Patient Information" className="shrink-0 bg-surface" contentClassName="overflow-visible">
          <SkeletonInfoSection rows={4} layout="grid" />
        </SectionContainer>
        <SectionContainer title="Order Progress" className="shrink-0 bg-surface" contentClassName="overflow-visible p-0" headerClassName="!py-1.5">
          <div className="p-4">
            <OrderProgressSkeleton />
          </div>
        </SectionContainer>
        <SectionContainer title="Tests" className="shrink-0 bg-surface" contentClassName="p-0 overflow-visible">
          <div className="border-t border-border-default">
            {Array.from({ length: TABLE_SKELETON_ROWS }).map((_, i) => (
              <SkeletonTableRow key={i} columns={4} />
            ))}
          </div>
        </SectionContainer>
        <SectionContainer title="Billing Summary" className="shrink-0 bg-surface" contentClassName="overflow-visible">
          <SkeletonInfoSection rows={3} layout="column" />
        </SectionContainer>
      </div>
    );
  }

  if (isMedium) {
    return (
      <div className="grid grid-cols-2 gap-4 w-full pb-6">
        <SectionContainer title="Order Information" className="bg-surface" contentClassName="overflow-visible">
          <SkeletonInfoSection rows={INFO_ROWS} layout="column" />
        </SectionContainer>
        <SectionContainer title="Patient Information" className="bg-surface" contentClassName="overflow-visible" headerClassName="!py-1.5">
          <SkeletonInfoSection rows={4} layout="column" />
        </SectionContainer>
        <SectionContainer title="Order Progress" className="bg-surface" contentClassName="overflow-visible p-0" headerClassName="!py-1.5">
          <div className="p-4">
            <OrderProgressSkeleton />
          </div>
        </SectionContainer>
        <SectionContainer title="Billing Summary" className="bg-surface" contentClassName="overflow-visible flex flex-col">
          <SkeletonInfoSection rows={3} layout="column" />
        </SectionContainer>
        <SectionContainer title="Tests" className="bg-surface col-span-2" contentClassName="p-0 overflow-visible">
          <div className="border-t border-border-default">
            {Array.from({ length: TABLE_SKELETON_ROWS }).map((_, i) => (
              <SkeletonTableRow key={i} columns={5} />
            ))}
          </div>
        </SectionContainer>
      </div>
    );
  }

  // Large: 3-col, left 2 cols = 2x2 grid (Order Info, Patient Info, Tests col-span-2), right 1 col = Order Progress, Billing
  return (
    <div
      className="flex-1 grid grid-cols-3 gap-4 min-h-0 h-full"
      style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}
    >
      <div
        className="col-span-2 grid grid-cols-2 grid-rows-[1fr_1fr] gap-4 min-h-0 h-full"
        style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}
      >
        <SectionContainer title="Order Information" className="h-full flex flex-col min-h-0" contentClassName="flex-1 min-h-0 overflow-y-auto">
          <SkeletonInfoSection rows={INFO_ROWS} layout="column" />
        </SectionContainer>
        <SectionContainer title="Patient Information" className="h-full flex flex-col min-h-0" contentClassName="flex-1 min-h-0 overflow-y-auto" headerClassName="!py-1.5">
          <SkeletonInfoSection rows={4} layout="column" />
        </SectionContainer>
        <SectionContainer title="Tests" className="h-full flex flex-col col-span-2 min-h-0" contentClassName="flex-1 min-h-0 p-0 overflow-y-auto">
          <div className="border-t border-border-default">
            {Array.from({ length: TABLE_SKELETON_ROWS }).map((_, i) => (
              <SkeletonTableRow key={i} columns={5} />
            ))}
          </div>
        </SectionContainer>
      </div>
      <div
        className="col-span-1 grid grid-rows-[1fr_1fr] gap-4 min-h-0 h-full"
        style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}
      >
        <SectionContainer title="Order Progress" className="h-full flex flex-col min-h-0" contentClassName="flex-1 min-h-0 overflow-y-auto p-0" headerClassName="!py-1.5">
          <div className="p-4">
            <OrderProgressSkeleton />
          </div>
        </SectionContainer>
        <SectionContainer title="Billing Summary" className="h-full flex flex-col min-h-0" contentClassName="flex-1 min-h-0 overflow-y-auto flex flex-col">
          <SkeletonInfoSection rows={3} layout="column" />
        </SectionContainer>
      </div>
    </div>
  );
};
