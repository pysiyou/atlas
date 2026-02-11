# Style Refactoring Master Plan

> **Scope:** Atlas LIS Frontend (`frontend/src/`)
> **Goal:** Enforce consistency and DRY principles across all feature pages while preserving the existing design token system.

---

## 1. Current Stack Analysis

### Styling Engine

| Layer | Technology | Location |
|---|---|---|
| **Design Tokens** | CSS Custom Properties (5-level hierarchy) | `shared/theme/theme.css` (696 lines) |
| **Utility Classes** | Tailwind CSS (mapped to CSS vars) | `tailwind.config.*` |
| **Component Styles** | Tailwind classes + TypeScript style objects | Per-component `.tsx` files |
| **Typography Tokens** | TypeScript constants (`DATA_ID_PRIMARY`, etc.) | `shared/constants/typography.ts` |
| **Domain Color Maps** | TypeScript `Record<string, BadgeColor>` | `shared/ui/{orders,samples,payments,catalog,misc}.ts` |
| **Feature-Specific Styles** | TypeScript constants (lab only) | `features/lab/utils/lab-styles.ts` |
| **Animations** | Framer Motion | Modal, LoadingSpinner |

### What Already Works Well

- **Design token hierarchy** is solid: Primitives -> Semantic tokens -> Tailwind classes -> Components.
- **Badge system** is centralized and consistent: `badgeHelpers.ts` is the single source of truth for variant-to-color mapping, used uniformly across all features.
- **Modal headers** are enforced by the shared `Modal` component (`text-lg font-semibold text-fg`).
- **SectionContainer** provides a consistent section header pattern (`uppercase text-xs text-fg-muted tracking-wide`).
- **ListView** enforces a consistent list-page shell (PageHeaderBar + filters + table).
- **Typography constants** exist in `shared/constants/typography.ts` for data-display consistency.

### What's Broken

The consistency breaks at the **page layout** and **detail page header** levels. The shared components exist but detail pages **don't use them**.

---

## 2. The "Violators"

### 2.1 — Page-Level Padding Inconsistency

Every top-level page defines its own outer wrapper with different padding:

| File | Outer Wrapper | Padding | Gap |
|---|---|---|---|
| `features/patient/pages/PatientDetail.tsx:72` | `min-h-full flex flex-col` | `p-2` | `gap-4` |
| `features/order/pages/OrderDetail.tsx:96` | `min-h-full flex flex-col` | `p-6` | `gap-4` |
| `features/catalog/pages/CatalogDetail.tsx:160` | `min-h-full flex flex-col` | `p-6` | *(none)* |
| `features/lab/pages/LaboratoryPage.tsx:61` | `min-h-full flex flex-col` | `p-2` | `gap-2` |
| `pages/DashboardPage.tsx:75` | `min-h-full flex flex-col` | `p-2` | `gap-2` |
| `pages/AppointmentsPage.tsx:14` | `min-h-full flex flex-col` | `p-2` | `gap-2` |
| `shared/components/data-display/ListView.tsx:147` | `min-h-0 flex-1 flex flex-col` | `p-2` | `gap-2` |
| `shared/components/data-display/DetailView.tsx:119` | `h-full flex flex-col` | `p-6` | *(none)* |

**Pattern:** List pages use `p-2 gap-2`, detail pages use `p-6 gap-4`, but it's implicit — no shared component enforces it.

### 2.2 — Detail Page Headers (3 Implementations, 0 Shared)

Each detail page builds its own header. None uses `PageHeaderBar` or `DetailView`:

| File | Title Element | Title Style | Wrapper |
|---|---|---|---|
| `features/patient/components/PatientHeader.tsx:28` | Avatar + AffiliationPopover (no `<h1>`) | *(no text title)* | `flex items-center justify-between w-full shrink-0 flex-nowrap gap-3` |
| `features/order/components/OrderHeader.tsx:28-30` | `<h1>` + 2 Badges | `text-sm font-bold text-brand font-mono` | `flex items-center justify-between mb-4 shrink-0 flex-wrap gap-3` |
| `features/catalog/pages/CatalogDetail.tsx:162-168` | `<h1>` + `<p>` subtitle (inline JSX) | `text-sm font-medium text-fg` | `flex items-center justify-between mb-4 shrink-0` |
| `shared/components/data-display/DetailView.tsx:139-159` | `<h1>` + badges + subtitle | `text-sm font-medium text-fg` | `flex items-center justify-between mb-4 shrink-0` |

**Problems:**
- PatientDetail has no `<h1>` at all (a11y violation).
- OrderHeader uses `font-bold` while CatalogDetail and DetailView use `font-medium`.
- OrderHeader adds `mb-4` to the header itself; PatientDetail's parent adds `h-14` constraint.
- None of these use `PageHeaderBar` (which uses `text-lg font-light`).
- `DetailView` exists as a shared component but is **used by zero feature pages**.

### 2.3 — Inline Loading / Error / Not-Found States

Identical JSX patterns repeated without a shared component:

| File | Pattern |
|---|---|
| `features/patient/pages/PatientDetail.tsx:28-33` | `<div className="flex items-center justify-center h-full"><div className="text-fg-subtle">Loading...</div></div>` |
| `features/order/pages/OrderDetail.tsx:40-44` | Same pattern, same classes |
| `features/patient/pages/PatientDetail.tsx:36-43` | "Patient not found" — inline `<p className="text-fg-subtle">` |
| `features/order/pages/OrderDetail.tsx:47-54` | "Order not found" — identical structure |

**Note:** `LoadingState` and `EmptyState` shared components already exist but are not used in detail pages.

### 2.4 — Layout Grid Duplication

The responsive layout pattern (Small/Medium/Large screen layouts) is duplicated between:
- `features/patient/pages/PatientDetailLayouts.tsx` (170 lines)
- `features/order/components/OrderDetailLayouts.tsx` (270 lines)

Both follow the same pattern:
```
SmallScreenLayout  → flex-col stack
MediumScreenLayout → grid-cols-2
LargeScreenLayout  → grid-cols-3 with nested grids + inline style overrides
```

Both use identical overflow escape hatches:
```tsx
style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}
```

### 2.5 — Lab Feature Style Island

`features/lab/utils/lab-styles.ts` defines its own parallel style system (126 lines) with:
- `LAB_CARD_TYPOGRAPHY` — partially duplicates `shared/constants/typography.ts`
- `LAB_CARD_SPACING` — unique to lab
- `LAB_CARD_CONTAINERS` — lab-specific card styling
- `LAB_CARD_LIST_ITEMS` — lab-specific list item styling
- `LAB_CARD_CONTEXT` — lab-specific context row styling
- `LAB_CARD_HEADER` — lab-specific header row styling

Some tokens reference shared constants (`TEXT_METADATA`, `BODY_SECONDARY`), others are standalone. This is a **contained** domain-specific style system — the issue is not that it exists, but that the same pattern doesn't exist for Order/Patient cards.

### 2.6 — Hardcoded Tailwind Colors in Badge System

`shared/ui/badgeHelpers.ts:34-40` uses raw Tailwind palette colors for extended badge colors:

```ts
purple: { text: 'text-purple-600', dot: 'bg-purple-500' },
pink:   { text: 'text-pink-600',   dot: 'bg-pink-500' },
teal:   { text: 'text-teal-600',   dot: 'bg-teal-500' },
// ... etc
```

These don't respond to theme changes (they're the same in light and dark mode). The semantic colors (`success`, `danger`, `warning`, `info`) correctly use CSS variable-backed classes like `text-success-fg-emphasis`.

---

## 3. The New Architecture

### 3.1 — Semantic Component Inventory

#### Tier 1: Page Shell Components (NEW)

| Component | Location | Purpose |
|---|---|---|
| **`<ListPageShell>`** | `shared/components/layouts/ListPageShell.tsx` | Standard wrapper for list pages. Replaces the `p-2 gap-2` div + PageHeaderBar pattern currently duplicated in ListView. |
| **`<DetailPageShell>`** | `shared/components/layouts/DetailPageShell.tsx` | Standard wrapper for detail pages. Props: `header`, `children`. Enforces `p-2 gap-4` padding, `flex-col` layout, scroll area. Replaces the hand-rolled wrappers in PatientDetail, OrderDetail, CatalogDetail. |

#### Tier 2: Header Components (REFACTOR)

| Component | Location | Purpose |
|---|---|---|
| **`<PageHeaderBar>`** | `shared/ui/PageHeaderBar.tsx` *(exists)* | Keep as-is for list pages. Already used by ListView and LaboratoryPage. |
| **`<DetailPageHeader>`** | `shared/components/layouts/DetailPageHeader.tsx` | NEW. Generic detail page header: title (h1) + optional subtitle + badges slot + actions slot. Enforces `text-sm font-medium text-fg` for title, `shrink-0`, consistent gap/margin. Feature-specific headers (PatientHeader, OrderHeader) become thin wrappers that pass content into this component. |

#### Tier 3: Feedback Components (ADOPT — already exist)

| Component | Location | Change Needed |
|---|---|---|
| **`<LoadingState>`** | `shared/components/feedback/LoadingState.tsx` | No change. Adopt in all detail pages. |
| **`<EmptyState>`** | `shared/ui/EmptyState.tsx` | No change. Adopt for "not found" states. |
| **`<ErrorAlert>`** | `shared/components/feedback/ErrorAlert.tsx` | No change. Adopt in all detail pages. |

#### Tier 4: Layout Primitives (NEW)

| Component | Location | Purpose |
|---|---|---|
| **`<ResponsiveGrid>`** | `shared/components/layouts/ResponsiveGrid.tsx` | Encapsulates the Small/Medium/Large responsive grid pattern. Props: `sections: DetailSection[]`, `breakpoint`. Replaces the duplicated `*Layouts.tsx` files with a declarative API. |

### 3.2 — Domain Style Strategy

**Principle:** Domain-specific color mappings stay in `shared/ui/` because they're consumed by the Badge component which is shared. But domain-specific *layout* styles (like lab card typography) should live in the feature.

| Category | Location | Rationale |
|---|---|---|
| Badge color maps (`orders.ts`, `samples.ts`, etc.) | `shared/ui/` *(keep)* | These are pure data consumed by `badgeHelpers.ts`. Moving them to features would create circular dependencies since Badge is shared. |
| Lab card styles (`lab-styles.ts`) | `features/lab/utils/` *(keep)* | Legitimately domain-specific. No other feature needs these exact styles. |
| Typography constants | `shared/constants/typography.ts` *(keep & extend)* | Add `DETAIL_TITLE` and `DETAIL_SUBTITLE` tokens for detail page headers. |
| Extended badge colors (purple, pink, teal...) | `shared/theme/theme.css` | Migrate from hardcoded Tailwind palette to CSS custom properties so they respond to themes. |

### 3.3 — Component Hierarchy (After Refactor)

```
List Page                           Detail Page
─────────                           ───────────
ListView (shared)                   DetailPageShell (shared)
  ├─ PageHeaderBar (shared)           ├─ DetailPageHeader (shared)
  ├─ ErrorAlert (shared)              │   ├─ <h1> (enforced)
  ├─ Filters (feature)               │   ├─ badges slot
  └─ Table (shared)                   │   └─ actions slot
                                      ├─ ErrorAlert (shared)
                                      └─ content area (feature layouts)
                                          └─ SectionContainer (shared)
```

---

## 4. Action Plan

### Phase 1: Foundation (Non-Breaking)

- [ ] **Step 1.1:** Add typography tokens to `shared/constants/typography.ts`
  - Add `DETAIL_TITLE = 'text-sm font-medium text-fg'`
  - Add `DETAIL_SUBTITLE = 'text-xs text-fg-subtle'`
  - Add `PAGE_TITLE = 'text-lg font-light text-fg'` (matches PageHeaderBar)

- [ ] **Step 1.2:** Add extended-color CSS variables to `shared/theme/theme.css`
  - Define `--purple`, `--pink`, `--teal`, `--orange`, `--indigo`, `--cyan` tokens per theme
  - Create Tailwind mappings (e.g., `text-purple-semantic`, `bg-purple-muted`)

- [ ] **Step 1.3:** Update `shared/ui/badgeHelpers.ts`
  - Replace hardcoded `text-purple-600` with new semantic classes
  - Ensure extended badge colors are theme-responsive

### Phase 2: New Shared Components

- [ ] **Step 2.1:** Create `shared/components/layouts/DetailPageHeader.tsx`
  - Props: `title: string`, `subtitle?: string`, `avatar?: ReactNode`, `badges?: ReactNode`, `actions?: ReactNode`, `className?: string`
  - Renders `<header>` with `<h1>` (enforced for a11y)
  - Uses `DETAIL_TITLE` / `DETAIL_SUBTITLE` typography tokens
  - Fixed structure: `flex items-center justify-between shrink-0 gap-3`

- [ ] **Step 2.2:** Create `shared/components/layouts/DetailPageShell.tsx`
  - Props: `header: ReactNode`, `children: ReactNode`, `className?: string`
  - Renders: outer `div.min-h-full.flex.flex-col.p-2.gap-4` + header slot (shrink-0) + content slot (flex-1 min-h-0 overflow-auto)
  - Handles standard loading/not-found/error patterns via optional `loading`, `error`, `notFound` props

- [ ] **Step 2.3:** Export new components from `shared/components/index.ts`

### Phase 3: Migrate Detail Pages

- [ ] **Step 3.1:** Refactor `PatientHeader.tsx`
  - Wrap content with `<DetailPageHeader>`, add a proper `<h1>` with patient name
  - Keep Avatar and AffiliationPopover as `avatar` slot content

- [ ] **Step 3.2:** Refactor `PatientDetail.tsx`
  - Replace hand-rolled outer div with `<DetailPageShell>`
  - Replace inline loading/not-found JSX with `DetailPageShell` built-in states (or `<LoadingState>` / `<EmptyState>`)
  - Keep responsive layout components as `children`

- [ ] **Step 3.3:** Refactor `OrderHeader.tsx`
  - Wrap with `<DetailPageHeader>`, pass orderId as title, priority/status Badges as `badges` slot

- [ ] **Step 3.4:** Refactor `OrderDetail.tsx`
  - Replace hand-rolled outer div with `<DetailPageShell>`
  - Replace inline loading/not-found JSX

- [ ] **Step 3.5:** Refactor `CatalogDetail.tsx`
  - Replace inline header JSX (lines 162-169) with `<DetailPageHeader>`
  - Replace hand-rolled outer div with `<DetailPageShell>`

### Phase 4: Evaluate DetailView Adoption or Deprecation

- [ ] **Step 4.1:** Assess `shared/components/data-display/DetailView.tsx`
  - It has 0 consumers. Decide: refactor it to compose `DetailPageShell` + `DetailPageHeader`, or delete it if the new components supersede it.
  - If keeping: update its header to use `DetailPageHeader` internally, update its wrapper to use `DetailPageShell` padding/gap.
  - If deleting: remove from exports and `shared/components/index.ts`.

### Phase 5: Standardize Loading/Error/Empty States

- [ ] **Step 5.1:** In each migrated detail page, replace:
  ```tsx
  // BEFORE (duplicated in 4+ files)
  <div className="flex items-center justify-center h-full">
    <div className="text-fg-subtle">Loading...</div>
  </div>
  ```
  with:
  ```tsx
  // AFTER
  <LoadingState message="Loading patient..." fullScreen />
  ```

- [ ] **Step 5.2:** Replace inline "not found" states with `<EmptyState>`:
  ```tsx
  <EmptyState icon={ICONS.actions.alertCircle} title="Patient Not Found" description="..." />
  ```

### Phase 6: Cleanup

- [ ] **Step 6.1:** Verify `PageHeaderBar` is only used by list-level pages (ListView, LaboratoryPage). Ensure detail pages use `DetailPageHeader` instead.

- [ ] **Step 6.2:** Audit remaining instances of `flex items-center justify-between mb-4 shrink-0` pattern across features — ensure they're all migrated to the new header component.

- [ ] **Step 6.3:** Run full build + type check to catch any regressions.

---

## 5. What This Plan Does NOT Change

| Area | Reason |
|---|---|
| **Badge color maps** (`orders.ts`, `payments.ts`, etc.) | They're pure data, correctly located. No UI logic leakage. |
| **Lab card styles** (`lab-styles.ts`) | Legitimately feature-specific. Well-structured with shared token references. |
| **Modal system** | Already consistent via shared `Modal` component. |
| **SectionContainer / TabbedSectionContainer** | Already consistent and widely adopted. |
| **Responsive layout files** (`PatientDetailLayouts.tsx`, `OrderDetailLayouts.tsx`) | These contain feature-specific layout decisions. Consolidating them into a generic `<ResponsiveGrid>` is a future optimization — not required for this refactor. |
| **ListView** | Already a well-structured shared component. |

---

## 6. Risk Assessment

| Risk | Mitigation |
|---|---|
| Regressions in page layout | Each migration is one page at a time. Visual diff before/after. |
| PatientHeader losing its unique Avatar layout | `DetailPageHeader` accepts an `avatar` slot — no layout change needed. |
| Breaking responsive behavior | Layout files stay untouched. Only the outer shell and header change. |
| Badge theme responsiveness | Test extended colors in all 3 themes (studio-light, github, noir-studio) after Step 1.2. |

---

## 7. Success Criteria

After this refactor:
1. Every detail page uses `<DetailPageShell>` for its outer wrapper (consistent padding, gap, scroll).
2. Every detail page has an `<h1>` rendered by `<DetailPageHeader>` (a11y compliance).
3. Zero inline `"Loading..."` strings — all use `<LoadingState>`.
4. Zero inline "not found" states — all use `<EmptyState>`.
5. Extended badge colors respond to theme switching.
6. `DetailView` is either adopted or removed (no dead code).
