/**
 * Loading chrome taxonomy — pick one surface, then one component.
 *
 * page   — route/chunk fallback: `PageLoadingFallback`, `PageContentLoadingFallback`
 *          (detail grids: `DetailPageLoadingGrid`; lab monitor: `LabMonitorLoadingGrid`)
 * panel  — `Panel` `loading` + `FieldsPlaceholder` (`panelLoading` header aside)
 * queue  — card worklists: `QueueListPlaceholder` (FieldsPlaceholder, no table header)
 * table  — `TableLoadingPlaceholder` (static headers + `FieldsPlaceholder` body)
 *          virtualized tables use `TableSkeleton` in `tableViewParts` (same body)
 * modal  — `ModalLoadingBody` (`overlays/modalLoading`); lab: `LabModalPlaceholder`
 * popover — `popoverFormLoadingContent` / `QualityIssuePopoverLoadingView`
 *
 * Lab wrappers (`LabResultsTableSkeleton`, `LabMonitorLoadingGrid`) pass domain
 * titles into the shared primitives above — do not clone skeleton markup.
 */

export type LoadingSurface = 'page' | 'panel' | 'queue' | 'table' | 'modal' | 'popover';
