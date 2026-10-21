import { Panel } from '@/components/surfaces';
import { LAYOUT, SPACING } from '@/theme/recipes';
import { cn } from '@/utils';
import { SkeletonInfoSection, SkeletonTableRow } from '@/components/loaders/Skeleton';
import type { DetailSkeletonSection } from '@/components/loaders/DetailPageSkeleton';
import { OrderProgressSkeleton } from './OrderProgressSkeleton';

export const ORDER_DETAIL_SKELETON_SECTIONS: DetailSkeletonSection[] = [
  { preset: 'panel.page.visible.shrink', title: 'Order Information', rows: 6, layout: 'grid' },
  { preset: 'panel.page.visible.shrink', title: 'Patient Information', rows: 4, layout: 'grid' },
  {
    preset: 'panel.pageEmbed.visible', title: 'Order activity',
    customContent: (
      <div className={SPACING.pPanel}>
        <OrderProgressSkeleton />
      </div>
    ),
  },
  {
    preset: 'panel.pageEmbed.visible', title: 'Tests',
    tableColumns: 4,
    tableRows: 4,
  },
  { preset: 'panel.pageEmbed.visible.flexColumn', title: 'Billing Summary', rows: 3, layout: 'column' },
];

export function renderOrderDetailLargeSkeleton() {
  return (
    <div className={LAYOUT.detailGridRowsSplit} style={{ height: '100%', maxHeight: '100%' }}>
      <div className={cn(LAYOUT.detailGrid3, 'min-h-0')}>
        <Panel preset="panel.page.auto.fill" title="Order Information">
          <SkeletonInfoSection rows={6} layout="column" />
        </Panel>
        <Panel preset="panel.page.auto.fill" title="Patient Information">
          <SkeletonInfoSection rows={4} layout="column" />
        </Panel>
        <Panel preset="panel.pageEmbed.auto.fill.flexColumnMin" title="Order activity">
          <div className={SPACING.pPanel}>
            <OrderProgressSkeleton />
          </div>
        </Panel>
      </div>

      <div className={cn(LAYOUT.detailGrid3, 'min-h-0')}>
        <Panel preset="panel.pageEmbed.span2Fill" title="Tests">
          <div className="border-t border-border-default">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonTableRow key={i} columns={5} />
            ))}
          </div>
        </Panel>
        <Panel preset="panel.pageEmbed.auto.fill.flexColumn" title="Billing Summary">
          <SkeletonInfoSection rows={3} layout="column" />
        </Panel>
      </div>
    </div>
  );
}
