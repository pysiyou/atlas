/**
 * Validation stage — business actions (approve/reject/escalate).
 * List/card/modal chrome lives in `workflow/`.
 *
 * | Role | Module |
 * |------|--------|
 * | Queue | `ResultValidationQueue` (this barrel) |
 * | Card | `workflow/cards/queueCard.resultValidation` |
 * | Modal | `workflow/modals/detailModal.escalation` + test-detail validate |
 * | Hooks | `useResultValidationWorkflow`, `useResultValidationQueueData` |
 *
 * Import rule: this folder may import `workflow/` shells. See `../ARCHITECTURE.md`.
 */

export { ResultValidationQueue } from './ResultValidationQueue';
