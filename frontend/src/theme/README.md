# Atlas design system (4 tiers)

| Tier | Location | Responsibility |
|------|----------|----------------|
| **Tokens** | `tokens/*.css`, `index.css` `@theme` | Raw values and semantic CSS variables |
| **Primitives** | `components/primitives/`, `components/layout/` | React building blocks without domain logic |
| **Recipes** | `recipes/*.ts`, `recipes/cva/*` | Composed Tailwind class stacks and CVA variants |
| **Components** | `components/*`, `features/*` | Product UI; consume primitives + recipes only |

## Import rules

- App and feature code: `import { TYPE, SPACING } from '@/theme/recipes'` (barrel only).
- Do not import recipe subpaths from features.

## Key recipe modules

- `worklistCard.ts` — dense worklist / queue list cards
- `workspaceSplit.ts`, `meterKpi.ts`, `feedGrouped.ts` — monitor / KPI layouts
- `segmentedControl.ts` — in-page segment tab rails
- `promo.ts` — sign-in / marketing surface typography
- `cva/` — `text`, `tableCell`, `button`, `metricTile`, `dataGrid`, `selectableCard`, `panelShell`

## Token groups

| CSS variable (semantic) | Tailwind utility | Notes |
|-------------------------|------------------|--------|
| `--text`, `--text-secondary` | `text-text-primary`, `text-text-secondary` | Foreground |
| `--surface`, `--surface-page` | `bg-surface`, `bg-surface-page` | Surfaces |
| `--lane-1-fg` … `--lane-7-fg` | `text-lane-1-fg`, `bg-lane-1-bg` | Pipeline lane accents |
| `--accent-chart-1` … `--accent-chart-12` | `text-accent-chart-1` | Chart series slots |
| `--space-*` | `gap-space-*`, `p-space-*` | Spacing scale |

## Typography

Role utilities live in `tokens/typography-utilities.css`. Use `Text` / `text()` CVA or `TYPE` in TSX — not raw `type-*` classes in features (ESLint).

## Panel presets

Layout-intent ids only: `components/surfaces/panelPresets/layoutPresets.ts`. Pass section copy with the `title` (and optional `meta`) props on `<Panel>`.

## Themes

Runtime palettes load from `themes/*.css`. Semantic light/dark tokens ship in the main bundle; `data-theme` selects brand overrides.

## Rules of engagement

1. **Four tiers only** — no new per-feature CSS files; global CSS is tokens + cross-cutting behavior (`theme/components/`).
2. **Barrel imports** — `@/theme/recipes` only from features.
3. **No business words in tokens or recipe export names** — map domain → UI in feature config (e.g. lab stage → `lane-*`).
4. **Typography** — prefer `<Text role="…" />` or `text({ role })`; avoid raw `type-*` in features.
5. **Tables** — `columnHelpers` + `TABLE_TYPE` / `tableCell()`; one datetime style app-wide.
6. **Spacing** — `gap-space-*`, `SPACING.*`, or `<Stack gap="…" />`.
7. **Color & radius** — semantic utilities + `RADIUS.*` from recipes; no Tailwind palette grays.
8. **Panels** — layout `preset` + `title` when needed; chrome stays in preset registry.
9. **Repeated patterns** — extend `theme/recipes`, not feature `*_LAYOUT` style constants.
10. **PR checklist** — `npm run lint`, spot-check two themes.
