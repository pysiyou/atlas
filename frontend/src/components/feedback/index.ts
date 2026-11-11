/**
 * Loading indicators and skeletons.
 * Catalogued toasts, alerts, and error boundaries: `@/feedback`.
 *
 * Loading chrome taxonomy — pick one surface, then one component:
 * page   — `PageLoadingFallback` / `PageContentLoadingFallback`
 *          (detail grids: `DetailPageLoadingGrid`; lab monitor: `LabMonitorLoadingGrid`)
 * panel  — `Panel` `loading` + `FieldsPlaceholder`
 * queue  — `QueueListPlaceholder`
 * table  — `TableLoadingPlaceholder` (virtualized: `TableSkeleton`)
 * modal  — `ModalLoadingBody`; lab: `LabModalPlaceholder`
 * popover — `popoverFormLoadingContent` / `QualityIssuePopoverLoadingView`
 */

export type LoadingSurface = 'page' | 'panel' | 'queue' | 'table' | 'modal' | 'popover';

export * from './LoadingState';
export * from './PageLoadingFallback';
export * from './LoadingScope';
export * from './Skeleton';
export * from './SpinnerLoader';
