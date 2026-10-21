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
| `link` | Inline actions (`View`, `See all`) — brand + underline |

**`intent`:** `default` | `muted` only.

Canonical CSS utilities: `type-body`, `type-ui-sm`, `type-ui-md`, `type-heading-sm`, `type-heading-xs`, `type-value`, `type-caption`, `type-section-title`, `type-page-title`, `type-panel-title`, `type-badge`, `type-micro`.

## Presentation slots (identity + tables)

These sit above `text()` roles. Use shared helpers — do not invent new flex stacks in features.

| Slot | Use | Implementation |
|------|-----|----------------|
| **identity.primary** | Human title (name, test) | `Text` `role="body"` `density="table"` in tables |
| **identity.secondary.meta** | Age, email, counts, dates | `TABLE_TYPE.meta` or `Text` `intent="muted"` |
| **identity.secondary.entity** | PAT/ORD/SAM/TST under a name | `renderTableSecondaryEntityId` / `EntityId` `variant="secondaryBlock"` |
| **identity.primary.entity** | ID is the cell value | `EntityId` `block` / `clickable` |
| **identity.inline** | Horizontal segments | `IdentityInline` + `IDENTITY_INLINE` |
| **identity.stack** | Primary over secondary | `IdentityStack` / `PRESENTATION_STACK_CLASS` |
| **status.table** | Badge + reason in tables | `StatusPresentationTableCell` |

**Entity tokens:** `--id-color` (brand) = primary ID columns; `--id-color-secondary` = entity sub-lines; body muted = non-ID meta.

**Mobile list cards** match table identity: e.g. order/payment cards show patient name + **patient** ID; order ID stays in footer/metadata.

## Tables

- Shell: `TABLE_SHELL`, cell padding `TABLE_CELL`, typography `TABLE_TYPE` (built from `text()`).
- Column renders: `@/utils/tableColumnRenders`, `@/utils/presentationRenders`.
- `TABLE_TYPE.meta` aligns with `tableCell({ tone: 'meta' })`.
- Foreground classes in features: `FG` from `@/theme/recipes` (not raw `text-text-*`). Track: `npm run design-system:inventory`.
- Inline links: `INLINE_LINK` on `<a>` / `<Link>`; `INLINE_LINK_BUTTON` on `<button type="button">`.

## Rules of engagement

1. **Four tiers only** — no per-feature CSS files.
2. **Barrel imports** — `@/theme/recipes` from features.
3. **No `TYPE`, `DETAIL_TYPE`, or raw legacy `type-*` utilities** in features.
4. **No raw `text-text-*` in features** — use `Text` or recipe strings.
5. **Sub-line entity IDs** — `secondaryBlock` or `renderTableSecondaryEntityId`, not bare `variant="secondary"` in tables.
6. **PR checklist** — Orders, Payments, Patients, Lab monitor, one card + one modal; `npm run lint`; light + dark themes.
