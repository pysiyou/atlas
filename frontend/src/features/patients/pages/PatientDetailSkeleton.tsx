/**
 * PatientDetailSkeleton - Loading placeholder for patient detail page.
 * Mirrors PatientDetailLayouts: SmallScreenLayout, MediumScreenLayout, LargeScreenLayout.
 */

import React from 'react';
import { useResponsiveLayout } from '@/hooks';
import { SectionPanel } from '@/components';
import { SkeletonInfoSection, SkeletonTableRow } from '@/components/loaders/Skeleton';

const InfoRows = 6;
const TableSkeletonRows = 4;

export const PatientDetailSkeleton: React.FC = () => {
  const { isSmall, isMedium } = useResponsiveLayout();

  if (isSmall) {
    return (
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto pb-6 bg-surface-page">
        <SectionPanel title="General Info" className="shrink-0 bg-surface" contentClassName="overflow-visible">
          <SkeletonInfoSection rows={InfoRows} layout="grid" />
        </SectionPanel>
        <SectionPanel title="Medical History" className="shrink-0 bg-surface" contentClassName="overflow-visible">
          <SkeletonInfoSection rows={4} layout="grid" />
        </SectionPanel>
        <SectionPanel title="Related Orders" className="shrink-0 bg-surface" contentClassName="p-0 overflow-visible" headerClassName="!py-1.5">
          <div className="border-t border-border-default">
            {Array.from({ length: TableSkeletonRows }).map((_, i) => (
              <SkeletonTableRow key={i} columns={5} />
            ))}
          </div>
        </SectionPanel>
        <SectionPanel title="Reports" className="bg-surface" contentClassName="overflow-visible">
          <SkeletonInfoSection rows={3} layout="column" />
        </SectionPanel>
      </div>
    );
  }

  if (isMedium) {
    return (
      <div className="grid grid-cols-2 gap-4 w-full pb-6">
        <SectionPanel title="General Info" className="bg-surface" contentClassName="overflow-visible">
          <SkeletonInfoSection rows={InfoRows} layout="column" />
        </SectionPanel>
        <SectionPanel title="Medical History" className="bg-surface" contentClassName="overflow-visible">
          <SkeletonInfoSection rows={4} layout="column" />
        </SectionPanel>
        <SectionPanel title="Reports" className="bg-surface col-span-2" contentClassName="overflow-visible flex flex-col">
          <SkeletonInfoSection rows={3} layout="column" />
        </SectionPanel>
        <SectionPanel title="Related Orders" className="bg-surface col-span-2" contentClassName="p-0 overflow-visible" headerClassName="!py-1.5">
          <div className="border-t border-border-default">
            {Array.from({ length: TableSkeletonRows }).map((_, i) => (
              <SkeletonTableRow key={i} columns={5} />
            ))}
          </div>
        </SectionPanel>
      </div>
    );
  }

  // Large
  return (
    <div
      className="flex-1 grid grid-cols-3 grid-rows-[1fr_1fr] gap-4 min-h-0 h-full"
      style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}
    >
      <SectionPanel title="General Info" className="h-full flex flex-col min-h-0" contentClassName="flex-1 min-h-0 overflow-y-auto">
        <SkeletonInfoSection rows={InfoRows} layout="column" />
      </SectionPanel>
      <SectionPanel title="Medical History" className="h-full flex flex-col min-h-0" contentClassName="flex-1 min-h-0 overflow-y-auto">
        <SkeletonInfoSection rows={4} layout="column" />
      </SectionPanel>
      <SectionPanel title="Reports" className="h-full flex flex-col min-h-0" contentClassName="flex-1 min-h-0 overflow-y-auto flex flex-col">
        <SkeletonInfoSection rows={3} layout="column" />
      </SectionPanel>
      <SectionPanel title="Related Orders" className="h-full flex flex-col col-span-3 min-h-0" contentClassName="flex-1 min-h-0 p-0 overflow-y-auto" headerClassName="!py-1.5">
        <div className="border-t border-border-default">
          {Array.from({ length: TableSkeletonRows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={5} />
          ))}
        </div>
      </SectionPanel>
    </div>
  );
};
