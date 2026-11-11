/**
 * Result-entry stage — queue entry and save/open workflow.
 *
 * | Role | Module |
 * |------|--------|
 * | Queue | `ResultEntryQueue` (this barrel) |
 * | Card | `workflow/cards/queueCard.resultEntry` |
 * | Modal | `workflow/modals/detailModal.resultEntry` |
 * | Hooks | `useResultEntryWorkflow`, `useResultEntryDetailModal` |
 *
 * Import rule: this folder may import `workflow/` shells. See `../ARCHITECTURE.md`.
 */

export { ResultEntryQueue } from './ResultEntryQueue';
