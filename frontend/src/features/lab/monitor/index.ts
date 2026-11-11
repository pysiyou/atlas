/**
 * Monitor stage — board (today, attention, event log, orders table).
 *
 * | Role | Module |
 * |------|--------|
 * | Queue | `LabMonitorBoard` (this barrel) |
 * | Table | `LabOrdersTable` |
 * | Hooks | `useLabMonitorViewModel` |
 *
 * Import rule: this folder may import `workflow/` shells. See `../ARCHITECTURE.md`.
 */

export { LabMonitorBoard } from './LabMonitorBoard';
