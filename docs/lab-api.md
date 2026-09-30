# Lab API and frontend cache map

## HTTP routes (prefix `/api/v1`)

| Route | Role | Purpose |
|-------|------|---------|
| `GET /lab/board` | Lab tech | Full monitor board (`detail=full` default) or summary-shaped full response (`detail=summary`) |
| `GET /lab/board/summary` | Lab tech | Tab badges + today KPIs only |
| `GET /lab/monitor` | Lab tech | Alias for `/lab/board` |
| `GET /lab/worklists/collection` | Sample collector | Collection queue (SQL paginated) |
| `GET /lab/worklists/entry` | Lab tech | Result entry queue |
| `GET /lab/worklists/validation` | Lab tech | Validation queue |
| `GET /lab/worklists/dashboard-today` | Lab tech | Tests updated today (monitor table) |
| `GET /lab/worklists/dashboard-blocked` | Lab tech | Recollection approval blockers |
| `PATCH /samples/{id}/collect` | Sample collector | Collect specimen |
| `POST /results/...` | Lab tech | Enter / validate / reject results |
| `GET /results/pending-escalation` | Lab tech | Escalation workbench |
| `POST /lab/quality-issues` | Role-gated | Report quality issue |
| `GET/POST /lab/recollection-requests/...` | Supervisor | Recollection approval |
| `GET/POST /critical-values/...` | Lab tech | Critical value notifications |

## React Query keys

- `labMonitor.boardSummary` — tab counts (`useLabMonitorSummaryQuery`)
- `labMonitor.boardFull` — monitor panels (`useLabMonitorBoardQuery`)
- `worklists.*` — stage queues and dashboard-today table

## Invalidation (frontend `lib/query/invalidate.ts`)

| After mutation | Call |
|----------------|------|
| Collect sample | `invalidateCollectionQueries` |
| Enter / validate / reject result | `invalidateResultQueries` |
| Quality issue | `invalidateQualityIssueQueries` |
| Recollection approve/deny | `invalidateRecollectionQueries` |
| Any lab workflow modal | `invalidateLabWorkflowQueries` (orders + monitor + worklists) |

Backend Redis: `lab:board:summary:{tech|supervisor}` TTL 15s, cleared on `LabOperationsService` mutations.
