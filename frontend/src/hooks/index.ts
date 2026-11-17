/** Shared React hooks — import from `@/hooks`. */

export {
  buildServerListPagination,
  useClientListChrome,
  useFilterChangeWithPageReset,
  useListLoadErrorToast,
  useServerListChrome,
  type BuildServerListPaginationParams,
  type ListPageChromeProps,
  type ListPageServerPagination,
  type UseClientListChromeOptions,
  type UseClientListChromeReturn,
  type UseServerListChromeOptions,
  type UseServerListChromeReturn,
} from './listPages';

export {
  applyPageFilters,
  useFilterBarBridge,
  useFilterState,
  usePageFilters,
  useQuickFilters,
  useUrlFilters,
  isUrlFilterKey,
  type FeatureFilterBarConfig,
  type UseFilterStateOptions,
  type UseFilterStateReturn,
  type UsePageFiltersOptions,
  type UsePageFiltersReturn,
  type UseQuickFiltersOptions,
  type UseUrlFiltersOptions,
  type UseUrlFiltersReturn,
} from './filters';

export {
  getColumnStyle,
  getGridTemplateColumns,
  useColumnStyles,
  useDataTable,
  useGridTemplateColumns,
  useTablePagination,
  useTableSort,
  type UseDataTableOptions,
} from './table';

export {
  isBreakpointAtLeast,
  isBreakpointAtMost,
  useBreakpoint,
  useDocumentVisible,
  useResponsiveLayout,
  type Breakpoint,
  type ResponsiveLayoutConfig,
} from './layout';

export {
  useDebouncedValue,
  useEntityLookup,
  usePaginatedPageSize,
  useResettablePage,
  type UseEntityLookupOptions,
} from './query';

export {
  useAnchoredPopoverDismiss,
  useAsyncAction,
  useDualHandleSlider,
  type UseAsyncActionReturn,
} from './ui';

export { useModuleListTitles } from '@/strings';