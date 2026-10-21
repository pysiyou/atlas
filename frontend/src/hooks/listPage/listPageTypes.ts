import type { ListLoadError } from './toListLoadError';
import type { ListViewPaginationConfig } from '@/components/data-table';

/** Loading/error/retry shape shared by ListView and list chrome hooks. */
export interface ListPageChromeProps {
  loading?: boolean;
  error?: ListLoadError | null;
  onRetry?: () => void;
}

/** Server list pages: pagination from useServerListChrome. */
export type ListPageServerPagination = ListViewPaginationConfig & { mode: 'server' };
