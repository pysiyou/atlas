/**
 * Collection stage — queue entry and collection actions.
 *
 * | Role | Module |
 * |------|--------|
 * | Queue | `SampleCollectionQueue` (this barrel) |
 * | Card | `workflow/cards/queueCard.sampleCollection` |
 * | Modal | `workflow/modals/detailModal.sampleCollection` |
 * | Hooks | `useSubmitSampleCollection`, collection popovers |
 *
 * Import rule: this folder may import `workflow/` shells. See `../ARCHITECTURE.md`.
 */

export { SampleCollectionQueue } from './SampleCollectionQueue';
