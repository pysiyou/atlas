import type { DetailSkeletonSection } from '@/components/loaders/DetailPageSkeleton';

export const PATIENT_DETAIL_SKELETON_SECTIONS: DetailSkeletonSection[] = [
  { title: 'General Info', rows: 6, layout: 'grid' },
  { title: 'Medical History', rows: 4, layout: 'grid' },
  {
    title: 'Related Orders',
    tableColumns: 5,
    tableRows: 4,
    contentClassName: 'p-0 overflow-visible',
    headerClassName: '!py-1.5',
  },
  { title: 'Reports', rows: 3, layout: 'column' },
];
