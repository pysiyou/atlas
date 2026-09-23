# Atlas UI components

Shared UI lives under `frontend/src/components/`. Feature-specific UI lives under `frontend/src/features/*/components/`.

## Layer rules

| Layer | Path | May import | Must not |
|-------|------|------------|----------|
| Tokens | `components/theme/` | CSS vars | React, features, API |
| Primitives | `components/primitives/` | theme, utils | features, data-fetching hooks |
| Inputs | `components/inputs/` | primitives, recipes | entity-specific types |
| Surfaces | `components/surfaces/` | primitives, recipes | routing, API |
| Overlays | `components/overlays/` | primitives, DialogChrome | feature copy |
| Display | `components/display/` | primitives, surfaces | feature stores, user lookup hooks |
| Data table | `components/data-table/` | display, surfaces, hooks | domain column renders, `@/features/**` |
| App shell | `app/` | components, features (composition) | — |
| Features | `features/*/` | `@/components`, other feature barrels | deep paths into other features |

ESLint enforces: **`src/components/**` must not import `@/features/**`** or **`@/utils/tableColumnRenders`**. Cross-feature access uses `@/features/<name>` barrels only (no `@/features/foo/components/Bar`, `@/features/foo/collection/...`, etc.). Inside a feature, prefer **relative imports** between subfolders; use the feature barrel from app and other features.

Lazy routes in [`App.tsx`](frontend/src/app/App.tsx) should `import('@/features/<name>')` and load page exports from each feature’s `index.ts`.

## Buttons and badges

- Prefer **`actionButtonPreset()`** from `@/components/primitives/buttonPresets` over semantic `Button` variants (`save`, `cancel`, etc. as variants).
- Domain status in tables and receipts: feature **`OrderStatusBadge`**, **`PaymentStatusBadge`**, **`LabDomainBadges`**, etc.—not raw status strings on the primitive **`Badge`**.
- Status → color maps live in **`@/utils/statusBadge.ts`**; styling in **`badgeStyles.ts`**.

## Tables and list views

- **`ListView`** + **`DataTable`** / **`TableView`**: generic shell (sort, pagination, responsive columns). No entity-specific cell JSX in `components/data-table`.
- **Generic cell helpers** (dates, contact block, name layout): `@/utils/tableColumnRenders.tsx`.
- **Order cells** (order id, tests block, totals, navigable id): `@/features/orders` → `orderTableColumnRenders`.
- **Patient cells** (patient id, name + age): `@/features/patients` → `patientTableColumnRenders`.
- Table configs live in each feature’s `config/*Table.config.tsx` and import helpers from the rows above.
- ESLint blocks importing `@/utils/tableColumnRenders` from `components/**`.

## Modals

1. Add **`ModalType`** and payload types in **`lib/context/modalTypes.ts`** (`ModalPropsMap`, **`BaseModalProps`**).
2. Register component + `getProps` in **`app/modals/modalRegistry.ts`** (import modals from feature barrels).
3. **`ModalRenderer`** in **`app/modals/ModalRenderer.tsx`** reads context and renders the active modal.

Feature code opens modals via **`useModal().openModal(...)`**, not by importing `ModalRenderer`.

## Design tokens

- Use **`RADIUS`**, **`TONE`**, **`CONTROL`**, **`PANEL`**, **`WORKSPACE`** from `@/components/theme/recipes`—not arbitrary `rounded-[…]` or `text-[Npx]`.

### Type roles (`recipes.ts`)

| Object | Use for | Do not use for |
|--------|---------|----------------|
| **`TYPE`** | Forms, filters, modals, page chrome, empty states | Table cells, detail panels |
| **`TABLE_TYPE`** | `DataTable`, pagination, `*Table.config.tsx`, table column renders | `DetailField`, form inputs |
| **`DETAIL_TYPE`** | `DetailField`, `DetailGroup`, `DetailsTable`, detail sections | Form inputs, table body cells |
| **`RECEIPT_TYPE`** | `OrderReceipt` (all variants) | General forms / tables |
| **`FIELD_ERROR`** / **`FIELD_ERROR_CAPTION`** | Validation messages under inputs | Body copy |
| **`FILTER_TYPE`** | Filter modal section titles | Inline filter chips |
| **`AUTH_TYPE`** | Login / auth module only | App chrome |

- Table density: **`TABLE_TYPE.size`** (scale), **`TABLE_TYPE.columnTitle`** (column headers), **`TABLE_TYPE.cell`** (body); shell layout **`TABLE_SHELL`** in `recipes.ts`. Padding: **`TABLE_CELL`** + `data-table/constants.ts`.
- Detail aliases in `@/utils/constants` (`DETAIL_LABEL`, `DETAIL_VALUE`, …) re-export **`DETAIL_TYPE`** for ergonomics.
- **Global font scale:** tune `--type-base` (and optional `--type-ratio`) in `src/components/theme/tokens/typography.css`. Per-theme optical correction: set `--type-base` / role weights in `src/components/theme/themes/<skin>.css` (e.g. aurora-light). Legacy `--font-size-*` aliases map to the modular scale for `text-xs`…`text-lg` during migration.
- **Semantic utilities:** `type-body`, `type-label`, etc. live in `src/components/theme/tokens/typography-utilities.css` (imported from `index.css`). **Do not** use raw `type-*` or `text-3xs`…`text-xl` in components/features (ESLint) — only in `src/components/theme/recipes.ts`.
- **Print labels:** `SampleCollectionLabelActions` snapshots `--type-*` tokens into print HTML; class names `type-caption` / `type-amount` there are intentional.
- Lab command center reference: **`commandCenterStyles.ts`** / **`dashboardStyles.ts`** (`TYPE` / `TONE`).

### Detail pages

- Shell: **`DetailPageShell`** + **`PageHeader`** (`components/layout`).
- Feature layouts: `*DetailLayouts.tsx`; loading: `config/*DetailSkeleton*`.
- Fields: **`DetailField`**, **`DetailGroup`**, **`DetailsTable`** (`components/display`).

## Deprecated patterns (avoid in new code)

- Importing domain table renders from `@/components/data-table`.
- Semantic button variants on `Button` when a preset exists.
- Deep imports across features (`@/features/other/hooks/useX`).
