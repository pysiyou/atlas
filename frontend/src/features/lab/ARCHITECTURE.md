# Lab feature layout

Lab is organized on **two axes**. Keep both; do not import sideways across stages.

## Stage folders (queue entry + stage-specific actions)

Each stage folder has an `index.ts` listing the queue entry and primary hooks.
Cards and modals stay in `workflow/` (see the table in each stage index).

| Stage | Queue | Primary hooks |
|-------|-------|----------------|
| `collection/` | `SampleCollectionQueue` | `useSubmitSampleCollection`, collection popovers |
| `entry/` | `ResultEntryQueue` | `useResultEntryWorkflow`, `useResultEntryDetailModal` |
| `validation/` | `ResultValidationQueue` | `useResultValidation*` — **business actions** |
| `monitor/` | `LabMonitorBoard` | `useLabMonitorViewModel` |

## `workflow/` (list/card/modal **shell**)

- `workflow/cards/` — queue cards per stage
- `workflow/modals/` — detail modals (`detailModal.testDetail.tsx` is the **test-detail** modal, not a unit test)
- `workflow/model/` — modal view-models
- `workflow/shared/` — card/modal layout chrome

**Import rule:** stage folders may import `workflow/` shells. Workflow should not import queue page components. Validation vs workflow: `validation/` owns mutations and forms; `workflow/` owns list/card/modal chrome.

## Public API

| Entry | Use for |
|-------|---------|
| `@/features/lab/routes` | Lazy route pages |
| `@/features/lab/cross` | Cross-feature imports (badges, links, grids) |
