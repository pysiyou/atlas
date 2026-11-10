# Bundle baseline (pre phase-2)

Build: `npm run build` in frontend/

| Chunk | Size (min) | gzip |
|-------|------------|------|
| index-CpH-GTWp.js | 30.41 kB | 10.68 kB |
| lab-workflow-BU6-K9_2.js | 1,053.08 kB | 295.82 kB |
| lab-Mmg5U0uC.js (route) | 1.98 kB | 0.95 kB |
| audit-CrQpy4PB.js (route) | 1.04 kB | 0.52 kB |
| vendor | 178.34 kB | 56.35 kB |

Note: `lab-workflow-modals` chunk not emitted separately (eager registry pulls workflow into graph).

## After phase-2 (bundle & delivery)

| Chunk | Size (min) | gzip |
|-------|------------|------|
| index-Ceifx23e.js | 5.52 kB | 2.06 kB |
| modal-shell | 3.20 kB | 1.29 kB |
| lab-workflow | 153.25 kB | 36.48 kB |
| lab-monitor-board | 16.43 kB | 4.85 kB |
| audit-catalog | 54.00 kB | 15.17 kB |
| audit-embed (lazy event log shell) | 594.67 kB | 178.00 kB |
| vendor | 178.30 kB | 56.33 kB |

**Deltas:** `lab-workflow` −~900 kB (modals/registry no longer in initial graph). Main `index` route shell slimmer. `audit-embed` loads on demand (modals/monitor event log).
