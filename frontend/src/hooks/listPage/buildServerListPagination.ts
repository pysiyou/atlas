import type { ListViewPaginationConfig } from '@/components/data-table';

export interface BuildServerListPaginationParams {
  page: number;
  pagination: { pageSize: number; total: number };
  goToPage: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}

/** Builds {@link ListViewPaginationConfig} for server-driven list pages. */
export function buildServerListPagination({
  page,
  pagination,
  goToPage,
  pageSizeOptions,
  onPageSizeChange,
}: BuildServerListPaginationParams): ListViewPaginationConfig {
  return {
    mode: 'server',
    currentPage: page,
    pageSize: pagination.pageSize,
    totalItems: pagination.total,
    onPageChange: goToPage,
    onPageSizeChange,
    pageSizeOptions,
  };
}
