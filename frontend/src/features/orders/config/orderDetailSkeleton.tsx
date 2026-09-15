import { PagePanel, PagePanelBody } from '@/components';
import { cn } from '@/utils';
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
  const scrollBody = 'flex-1 min-h-0 overflow-y-auto p-4';

  return (
    <div
      className="flex-1 grid grid-rows-[1fr_1fr] gap-4 min-h-0 h-full overflow-hidden"
      style={{ height: '100%', maxHeight: '100%' }}
    >
      <div className="grid grid-cols-3 gap-4 min-h-0">
        <PagePanel title="Order Information" className="h-full min-h-0">
          <PagePanelBody className={scrollBody}>
            <SkeletonInfoSection rows={5} layout="column" />
          </PagePanelBody>
        </PagePanel>
        <PagePanel title="Patient Information" className="h-full min-h-0">
          <PagePanelBody className={scrollBody}>
            <SkeletonInfoSection rows={4} layout="column" />
          </PagePanelBody>
        </PagePanel>
        <PagePanel title="Order Progress" className="h-full min-h-0">
          <PagePanelBody className="flex-1 min-h-0 overflow-y-auto p-0">
            <div className="p-4">
              <OrderProgressSkeleton />
            </div>
          </PagePanelBody>
        </PagePanel>
      </div>

      <div className="grid grid-cols-3 gap-4 min-h-0">
        <PagePanel title="Tests" className="h-full min-h-0 col-span-2">
          <PagePanelBody className="flex-1 min-h-0 p-0 overflow-y-auto">
            <div className="border-t border-border-default">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonTableRow key={i} columns={5} />
              ))}
            </div>
          </PagePanelBody>
        </PagePanel>
        <PagePanel title="Billing Summary" className="h-full min-h-0">
          <PagePanelBody className={cn(scrollBody, 'flex flex-col')}>
            <SkeletonInfoSection rows={3} layout="column" />
          </PagePanelBody>
        </PagePanel>
      </div>
    </div>
  );
}
