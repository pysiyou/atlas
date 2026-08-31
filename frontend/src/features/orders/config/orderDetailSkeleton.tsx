import { SectionPanel } from '@/components';
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
    contentClassName: 'overflow-visible p-0',
    headerClassName: '!py-1.5',
  },
  {
    title: 'Tests',
    tableColumns: 4,
    tableRows: 4,
    contentClassName: 'p-0 overflow-visible',
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
        <SectionPanel
          title="Order Information"
          className="h-full flex flex-col min-h-0"
          contentClassName="flex-1 min-h-0 overflow-y-auto"
        >
          <SkeletonInfoSection rows={5} layout="column" />
        </SectionPanel>
        <SectionPanel
          title="Patient Information"
          className="h-full flex flex-col min-h-0"
          contentClassName="flex-1 min-h-0 overflow-y-auto"
          headerClassName="!py-1.5"
        >
          <SkeletonInfoSection rows={4} layout="column" />
        </SectionPanel>
        <SectionPanel
          title="Order Progress"
          className="h-full flex flex-col min-h-0"
          contentClassName="flex-1 min-h-0 overflow-y-auto p-0"
          headerClassName="!py-1.5"
        >
          <div className="p-4">
            <OrderProgressSkeleton />
          </div>
        </SectionPanel>
      </div>

      <div className="grid grid-cols-3 gap-4 min-h-0">
        <SectionPanel
          title="Tests"
          className="h-full flex flex-col min-h-0 col-span-2"
          contentClassName="flex-1 min-h-0 p-0 overflow-y-auto"
        >
          <div className="border-t border-border-default">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonTableRow key={i} columns={5} />
            ))}
          </div>
        </SectionPanel>
        <SectionPanel
          title="Billing Summary"
          className="h-full flex flex-col min-h-0"
          contentClassName="flex-1 min-h-0 overflow-y-auto flex flex-col"
        >
          <SkeletonInfoSection rows={3} layout="column" />
        </SectionPanel>
      </div>
    </div>
  );
}
