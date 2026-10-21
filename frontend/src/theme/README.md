# Atlas design system (4 tiers)

| Tier | Location | Responsibility |
|------|----------|----------------|
| **Tokens** | `tokens/*.css`, `index.css` `@theme` | Raw values and semantic CSS variables |
| **Primitives** | `components/primitives/`, `components/layout/` | React building blocks without domain logic |
| **Recipes** | `recipes/*.ts`, `recipes/cva/*` | Composed Tailwind class stacks and CVA variants |
| **Components** | `components/*`, `features/*` | Product UI; consume primitives + recipes only |

## Import rules

- App and feature code: `import { text, SPACING } from '@/theme/recipes'` (barrel only).
- Typography in JSX: `import { Text } from '@/components/layout/Text'`.

## Typography (single API)

Use **`text({ role, intent?, density? })`** in recipes and **`Text`** in components.

| `role` | Use for |
|--------|---------|
| `title-page` | Page / hero titles |
| `title-section` | Section or card titles |
| `title-panel` | Panel headers |
| `title-modal` | Modal chrome titles |
| `section-title` | Uppercase group labels (tables, detail groups, chrome) |
| `label` | Field / row labels |
| `body` | Values, descriptions, default copy |
| `caption` | Fine print |
| `amount` | Currency, counts, emphasized figures |

**`intent`:** `default` | `muted` only.

Canonical CSS utilities: `type-body`, `type-ui-sm`, `type-ui-md`, `type-heading-sm`, `type-heading-xs`, `type-value`, `type-caption`, `type-section-title`, `type-page-title`, `type-panel-title`, `type-badge`, `type-micro`.

## Rules of engagement

1. **Four tiers only** — no per-feature CSS files.
2. **Barrel imports** — `@/theme/recipes` from features.
3. **No `TYPE`, `DETAIL_TYPE`, or raw legacy `type-*` utilities** in features.
4. **Tables** — `tableCell()` + `Text` / `TABLE_TYPE` (recipe-only strings built from `text()`).
5. **PR checklist** — `npm run lint`, two themes.
