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
| Display | `components/display/` | primitives, surfaces | `useUserLookup`, feature stores |
| Data table | `components/data-table/` | display, surfaces | order/patient column helpers |
| Filters | `components/filters/` | inputs, overlays | — |
| Layout | `components/layout/` | theme, primitives | feature pages |

Styling: compose Tailwind via `@/components/theme/recipes` (`TYPE`, `TONE`, `SURFACE`, `SPACING`, `CONTROL`, etc.). Extend with `className` + `cn()`.

## Prop conventions

- Visual: `variant`, `size`, `tone`
- Layout: `padding`, `spacing`, `scroll`, `fullWidth`, `fill`
- State: `disabled`, `isLoading`, `active`, `open` / `isOpen` (modals use `isOpen`)
- Slots: `headerStart`, `headerEnd`, `actions`, `footer`, `children`
- Domain status → `@/utils/statusBadge` or feature formatters, not primitive internals

## Controlled vs uncontrolled

- Forms: controlled (`value` + `onChange`)
- Modals: controlled (`isOpen`, `onClose`); use `DialogFooter` / `FormDialogFooter` for actions
- Popovers: controlled optional (`open`, `onOpenChange`) or internal state when omitted
- Tables: optional controlled `sort` / `onSortChange`
- Filters: controlled via `useFilterState`

## Component APIs (canonical)

| Component | Notes |
|-----------|--------|
| `Button` / `IconButton` | `variant` is a base tone only; use `actionButtonPreset()` or explicit `iconName` |
| `Modal` | `size` only (`default` ≈ 600px); no header confirm — footer actions in children |
| `DataTable` | Import `DataTable` (not `Table`) from `@/components/data-table` |
| `Badge` | Prefer `resolveStatusBadgeColor()` + `label` for domain statuses |
| `ListView` | Pagination via `{ mode: 'client' \| 'server' \| 'none' }` |

## Cross-cutting placement

When the same UI appears in **two or more features**, lift it out of a single feature folder:

| Kind | Location | Examples |
|------|----------|----------|
| Generic layout / form chrome | `@/components/display` or `@/components/overlays` | `DetailFieldsColumnFlow`, `DetailGroup`, `FormDialogFooter`, `PopoverFormChrome`, `RadioCard` |
| Domain data + hooks (orders + payments) | Feature **public API** barrel (`@/features/orders`, `@/features/payments`) | `BillingSummarySection`, `OrderReceipt`, `PaymentMethodSelector` |
| Table / status helpers | `@/utils` or owning feature barrel | `tableColumnRenders`, `statusBadge`, `createOrderSharedColumns` |

New code should import from `@/components` or the feature barrel, not `@/features/*/components/*`.

## Import boundaries

`src/components/**` must not import from `@/features/**` (enforced by ESLint).
