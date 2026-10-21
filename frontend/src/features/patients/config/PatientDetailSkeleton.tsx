/**
 * Loading skeleton for the patient detail page.
 * Mirrors the record row (profile, history, care snapshot) and the orders | reports row.
 */

import { Panel } from '@/components/surfaces';
import { LAYOUT } from '@/theme/recipes';
import { cn } from '@/utils';
import { SkeletonInfoSection, SkeletonTableRow } from '@/components/loaders/Skeleton';
import type { DetailSkeletonSection } from '@/components/loaders/DetailPageSkeleton';

export const PATIENT_DETAIL_SKELETON_SECTIONS: DetailSkeletonSection[] = [
  { preset: 'panel.page.visible.shrink', title: 'General Info', rows: 6, layout: 'grid' },
  { preset: 'panel.page.visible.shrink', title: 'Medical History', rows: 6, layout: 'grid' },
  { preset: 'panel.page.visible.span2', title: 'Care Snapshot', rows: 6, layout: 'column' },
  {
    preset: 'panel.pageEmbed.visible', title: 'Related Orders',
    tableColumns: 5,
    tableRows: 4,
  },
  { preset: 'panel.page.visible.flexColumn', title: 'Reports', rows: 3, layout: 'column' },
];

/** Large-screen skeleton: three record panels over orders (2 cols) and reports (1 col). */
export function renderPatientDetailLargeSkeleton() {
  return (
    <div
      className="flex-1 grid grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-layout-section min-h-0 h-full overflow-hidden"
      style={{ height: '100%', maxHeight: '100%' }}
    >
      <div className={cn(LAYOUT.detailGrid3, 'min-h-0')}>
        <Panel preset="panel.page.auto.fill" title="General Info">
          <SkeletonInfoSection rows={6} layout="column" />
        </Panel>
        <Panel preset="panel.page.auto.fill" title="Medical History">
          <SkeletonInfoSection rows={6} layout="column" />
        </Panel>
        <Panel preset="panel.page.auto.fill" title="Care Snapshot">
          <SkeletonInfoSection rows={6} layout="column" />
        </Panel>
      </div>

      <div className={cn(LAYOUT.detailGrid3, 'min-h-0')}>
        <Panel preset="panel.pageEmbed.span2Min" title="Related Orders">
          <div className="border-t border-border-default">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonTableRow key={index} columns={5} />
            ))}
          </div>
        </Panel>
        <Panel preset="panel.page.detailMinH.flexColumn" title="Reports">
          <SkeletonInfoSection rows={3} layout="column" />
        </Panel>
      </div>
    </div>
  );
}
