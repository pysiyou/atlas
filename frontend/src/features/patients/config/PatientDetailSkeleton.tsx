/**
 * Loading skeleton for the patient detail page.
 * Mirrors the record row (profile, history, care snapshot) and the orders | reports row.
 */

import { Panel } from '@/components/surfaces';
import { LAYOUT } from '@/components/theme/recipes';
import { cn } from '@/utils';
import { SkeletonInfoSection, SkeletonTableRow } from '@/components/loaders/Skeleton';
import type { DetailSkeletonSection } from '@/components/loaders/DetailPageSkeleton';

export const PATIENT_DETAIL_SKELETON_SECTIONS: DetailSkeletonSection[] = [
  { preset: 'patient.detail.generalInfo.stack', rows: 6, layout: 'grid' },
  { preset: 'patient.detail.medicalHistory.stack', rows: 6, layout: 'grid' },
  { preset: 'patient.detail.careSnapshot.span2', rows: 6, layout: 'column' },
  {
    preset: 'patient.detail.relatedOrders',
    tableColumns: 5,
    tableRows: 4,
  },
  { preset: 'patient.detail.reports', rows: 3, layout: 'column' },
];

/** Large-screen skeleton: three record panels over orders (2 cols) and reports (1 col). */
export function renderPatientDetailLargeSkeleton() {
  return (
    <div
      className="flex-1 grid grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-layout-section min-h-0 h-full overflow-hidden"
      style={{ height: '100%', maxHeight: '100%' }}
    >
      <div className={cn(LAYOUT.detailGrid3, 'min-h-0')}>
        <Panel preset="patient.detail.generalInfo.fill">
          <SkeletonInfoSection rows={6} layout="column" />
        </Panel>
        <Panel preset="patient.detail.medicalHistory.fill">
          <SkeletonInfoSection rows={6} layout="column" />
        </Panel>
        <Panel preset="patient.detail.careSnapshot.fill">
          <SkeletonInfoSection rows={6} layout="column" />
        </Panel>
      </div>

      <div className={cn(LAYOUT.detailGrid3, 'min-h-0')}>
        <Panel preset="patient.detail.relatedOrders.span2Fill">
          <div className="border-t border-border-default">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonTableRow key={index} columns={5} />
            ))}
          </div>
        </Panel>
        <Panel preset="patient.detail.reports.fill">
          <SkeletonInfoSection rows={3} layout="column" />
        </Panel>
      </div>
    </div>
  );
}
