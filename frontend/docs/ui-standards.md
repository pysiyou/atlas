# Atlas frontend UI standards

The single source of truth for typography, tables, and shells is [`src/components/theme/recipes.ts`](../src/components/theme/recipes.ts). Prefer recipe tokens over raw Tailwind text/spacing classes.

## Typography

| Role | Token |
|------|--------|
| Page / list bar title | `TYPE.pageTitle` via `PageHeader` |
| Detail page title | `TYPE.detailTitle` |
| In-page panel header | `TYPE.panelTitle` (`PANEL` page presets) |
| Lab panel header | `TYPE.sectionTitle` (`PANEL` lab presets — uppercase) |
| Modal title | `TYPE.modalTitle` (`DialogChrome`) |
| Table body cell | `TABLE_TYPE.cell` |
| Table datetime column | `renderDateTimeCell` / `TABLE_TYPE.datetime` |
| Detail fields | `DETAIL_TYPE.*` |

Do not stack `font-bold`, `font-semibold`, or `font-medium` on elements that already use `type-*` utilities unless a named recipe (e.g. `ERROR_SURFACE_TYPE`) defines it.

Report preview headers use `REPORT_PREVIEW_TYPE` in recipes.

## Data tables

- Column width presets: `COLUMN_SIZE` in [`constants.ts`](../src/components/data-table/constants.ts).
- Semantic widths: `TABLE_COLUMN_WIDTH` (`datetime`, `badge`, `badgeWide`, `action`, `actionDual`).
- Datetime columns: `createDateTimeColumn` or `width: TABLE_COLUMN_WIDTH.datetime` + `renderDateTimeCell`.
- Badge columns: `createBadgeColumn` (default `badge` width); use `badgeWide` for long labels (e.g. user role).
- Badges inside cells: `className={BADGE.tableEmbed}`.
- Primary line text in custom renders: `TABLE_PRIMARY_CELL_CLASS` from `@/utils/tableColumnRenders`.

## Layout

- List pages: `ListView` + `PageHeader variant="bar"` + `WORKSPACE.page`.
- Dashboard and similar greeting bars: same `PageHeader` pattern (not ad hoc `h-14` blocks).
- Spacing: `gap-layout-section`, `p-panel`, `SPACING.*` — avoid raw `gap-4` / `p-4` in feature code (see comment on `SPACING` in recipes).

## Panels

- **Page panels** (`Panel` page presets): raised shell, `TYPE.panelTitle`.
- **Lab panels** (`Panel` lab presets): recessed shell, `TYPE.sectionTitle`.

Do not add a third panel title style at call sites; extend presets in the panel registry if needed.
