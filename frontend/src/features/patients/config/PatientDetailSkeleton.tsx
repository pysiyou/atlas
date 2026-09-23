/**
 * Loading skeleton for the patient detail page.
 * Mirrors the record row (profile, history, care snapshot) and the orders | reports row.
 */

import { Panel } from '@/components';
import { LAYOUT } from '@/components/theme/recipes';
import { cn } from '@/utils';
import { SkeletonInfoSection, SkeletonTableRow } from '@/components/loaders/Skeleton';
import type { DetailSkeletonSection } from '@/components/loaders/DetailPageSkeleton';

export const PATIENT_DETAIL_SKELETON_SECTIONS: DetailSkeletonSection[] = [
  { title: 'General Info', rows: 6, layout: 'grid' },
  { title: 'Medical History', rows: 6, layout: 'grid' },
  { title: 'Care Snapshot', rows: 6, layout: 'column', colSpan: 2 },
  {
    title: 'Related Orders',
    tableColumns: 5,
    tableRows: 4,
    padding: 'none',
    scroll: 'visible',
  },
  { title: 'Reports', rows: 3, layout: 'column' },
];

/** Large-screen skeleton: three record panels over orders (2 cols) and reports (1 col). */
export function renderPatientDetailLargeSkeleton() {
  return (
    <div
      className="flex-1 grid grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-layout-section min-h-0 h-full overflow-hidden"
      style={{ height: '100%', maxHeight: '100%' }}
    >
      <div className={cn(LAYOUT.detailGrid3, 'min-h-0')}>
        <Panel title="General Info" className="min-h-0" scroll="auto">
          <SkeletonInfoSection rows={6} layout="column" />
        </Panel>
        <Panel title="Medical History" className="min-h-0" scroll="auto">
          <SkeletonInfoSection rows={6} layout="column" />
        </Panel>
        <Panel title="Care Snapshot" className="min-h-0" scroll="auto">
          <SkeletonInfoSection rows={6} layout="column" />
        </Panel>
      </div>

      <div className={cn(LAYOUT.detailGrid3, 'min-h-0')}>
        <Panel title="Related Orders" className="min-h-0 col-span-2" padding="none" scroll="auto">
          <div className="border-t border-border-default">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonTableRow key={index} columns={5} />
            ))}
          </div>
        </Panel>
        <Panel title="Reports" className="min-h-0" scroll="auto" bodyClassName="flex flex-col">
          <SkeletonInfoSection rows={3} layout="column" />
        </Panel>
      </div>
    </div>
  );
}
