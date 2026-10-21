# List page platform

Shared wiring for feature list pages that render [`ListView`](../../components/surfaces/ListView.tsx).

## Server-paginated lists

Examples: orders, patients, payments, reports.

1. **`usePageFilters`** — filter state (`initialFilters`, `setFilter`).
2. Map filters to API params (`serverFilters` `useMemo`).
3. Paginated query hook (`page`, `goToPage`, `resetPage`, `pagination`, `isLoading`, `isError`, `refetch`).
4. **`useServerListChrome`** — `loading`, `error`, `onRetry`, `listPagination`, `setFilterAndReset`.
5. **`ListView`** — pass `items`, `viewConfig` from `*Table.config.tsx`, `filters` slot, `pagination: listPagination`.

Sort: pass `sort` / `onSortChange` to `ListView` when the API supports server sort; otherwise rely on client sort inside `DataTable` / `useDataTable`.

## Client-filtered lists

Examples: catalog, users.

1. **`usePageFilters`** + **`applyPageFilters`** on the full dataset (or subset).
2. **`useClientListChrome`** — `loading`, `error`, `onRetry` from the fetch query.
3. **`ListView`** — `pagination: { mode: 'client', pageSize, pageSizeOptions }` or `mode: 'none'`.

## Modals and nested queries

Use **`useClientListChrome`** with the nested query’s `isLoading` / `isError` / `error` / `refetch` (same shape as list pages). Do not call `toListLoadError` in feature code (it is internal to `hooks/listPage` chrome helpers).

## Table stack

`ListView` → `DataTable` → **`useDataTable`** → `useTableSort` / `useTablePagination`. **`TableView`** is presentational only (virtualized rows, header, skeleton).
