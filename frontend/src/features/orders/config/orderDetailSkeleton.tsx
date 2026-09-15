import { Panel } from '@/components';
import { SkeletonInfoSection, SkeletonTableRow } from '@/components/loaders/Skeleton';
import type { DetailSkeletonSection } from '@/components/loaders/DetailPageSkeleton';
import { OrderProgressSkeleton } from './OrderProgressSkeleton';

export const ORDER_DETAIL_SKELETON_SECTIONS: DetailSkeletonSection[] = [
  { title: 'Order Information', rows: 5, layout: 'grid' },
  { title: 'Patient Information', rows: 4, layout: 'grid' },
  {
    title: 'Order Progress',
    customContent: (
      <div className="p-4">
        <OrderProgressSkeleton />
      </div>
    ),
    padding: 'none',
    scroll: 'visible',
  },
  {
    title: 'Tests',
    tableColumns: 4,
    tableRows: 4,
    padding: 'none',
    scroll: 'visible',
  },
  { title: 'Billing Summary', rows: 3, layout: 'column' },
];

export function renderOrderDetailLargeSkeleton() {
  return (
    <div
      className="flex-1 grid grid-rows-[1fr_1fr] gap-4 min-h-0 h-full overflow-hidden"
      style={{ height: '100%', maxHeight: '100%' }}
    >
      <div className="grid grid-cols-3 gap-4 min-h-0">
        <Panel title="Order Information" className="min-h-0" scroll="auto">
          <SkeletonInfoSection rows={5} layout="column" />
        </Panel>
        <Panel title="Patient Information" className="min-h-0" scroll="auto">
          <SkeletonInfoSection rows={4} layout="column" />
        </Panel>
        <Panel title="Order Progress" className="min-h-0" padding="none" scroll="auto">
          <div className="p-4">
            <OrderProgressSkeleton />
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-3 gap-4 min-h-0">
        <Panel title="Tests" className="min-h-0 col-span-2" padding="none" scroll="auto">
          <div className="border-t border-border-default">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonTableRow key={i} columns={5} />
            ))}
          </div>
        </Panel>
        <Panel
          title="Billing Summary"
          className="min-h-0"
          scroll="auto"
          bodyClassName="flex flex-col"
        >
          <SkeletonInfoSection rows={3} layout="column" />
        </Panel>
      </div>
    </div>
  );
}
