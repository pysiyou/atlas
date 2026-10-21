import { Panel } from '@/components/surfaces';
import { LAYOUT, SPACING } from '@/theme/recipes';
import { cn } from '@/utils';
import { SkeletonInfoSection, SkeletonTableRow } from '@/components/loaders/Skeleton';
import type { DetailSkeletonSection } from '@/components/loaders/DetailPageSkeleton';
import { OrderProgressSkeleton } from './OrderProgressSkeleton';

export const ORDER_DETAIL_SKELETON_SECTIONS: DetailSkeletonSection[] = [
  { preset: 'order.detail.information.stack', rows: 6, layout: 'grid' },
  { preset: 'order.detail.patient.stack', rows: 4, layout: 'grid' },
  {
    preset: 'order.detail.activity',
    customContent: (
      <div className={SPACING.pPanel}>
        <OrderProgressSkeleton />
      </div>
    ),
  },
  {
    preset: 'order.detail.tests',
    tableColumns: 4,
    tableRows: 4,
  },
  { preset: 'order.detail.billing', rows: 3, layout: 'column' },
];

export function renderOrderDetailLargeSkeleton() {
  return (
    <div className={LAYOUT.detailGridRowsSplit} style={{ height: '100%', maxHeight: '100%' }}>
      <div className={cn(LAYOUT.detailGrid3, 'min-h-0')}>
        <Panel preset="order.detail.information.fill">
          <SkeletonInfoSection rows={6} layout="column" />
        </Panel>
        <Panel preset="order.detail.patient.fill">
          <SkeletonInfoSection rows={4} layout="column" />
        </Panel>
        <Panel preset="order.detail.activity.fill">
          <div className={SPACING.pPanel}>
            <OrderProgressSkeleton />
          </div>
        </Panel>
      </div>

      <div className={cn(LAYOUT.detailGrid3, 'min-h-0')}>
        <Panel preset="order.detail.tests.span2Fill">
          <div className="border-t border-border-default">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonTableRow key={i} columns={5} />
            ))}
          </div>
        </Panel>
        <Panel preset="order.detail.billing.fill">
          <SkeletonInfoSection rows={3} layout="column" />
        </Panel>
      </div>
    </div>
  );
}
