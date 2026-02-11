# Atlas Theme System Refactoring Plan

> **Reference project**: cargoplan (`~/Desktop/xidera/cargoplan/frontend`)
> **Generated**: 2026-02-11
> **Scope**: `src/shared/theme/theme.css` + `src/index.css` + all component consumers

---

## Table of Contents

1. [Cargoplan vs Atlas Naming (Reference)](#1-cargoplan-vs-atlas-naming-reference)
2. [How Theme Variables Are Used (Atlas)](#2-how-theme-variables-are-used-atlas)
3. [Problems Found](#3-problems-found)
4. [Recommended Renames & Mappings](#4-recommended-renames--mappings)
5. [Refactoring Phases](#5-refactoring-phases)
   - Phase 1: Fix Bugs (undefined variables, missing auth token)
   - Phase 2: Rename `stroke` → `border`
   - Phase 3: Rename `fg` → `text`
   - Phase 4: Rename `canvas/panel` → `surface`
   - Phase 5: Add `tone-*` layer for badges/alerts
   - Phase 6: Normalize status token shapes
   - Phase 7: Delete dead tokens
   - Phase 8: Optional — shadow aliases, disabled opacity
6. [Token Flow Diagram (After Refactor)](#6-token-flow-diagram-after-refactor)
7. [Migration Checklist](#7-migration-checklist)
8. [Full Variable Reference (Before/After)](#8-full-variable-reference-beforeafter)

---

## 1. Cargoplan vs Atlas Naming (Reference)

### Cargoplan (theme.css)

| Category | Pattern | Examples |
|----------|---------|----------|
| **Text** | `--text-*` | `--text`, `--text-secondary`, `--text-tertiary`, `--text-muted`, `--text-disabled`, `--text-accent`, `--text-inverse`, `--placeholder` |
| **Surfaces** | `--surface-*` + `--app-background` | `--app-background`, `--surface`, `--surface-elev`, `--surface-card`, `--surface-muted`, `--surface-contrast`, `--surface-hover`, `--surface-selected`, `--overlay` |
| **Borders** | `--border-*` | `--border`, `--border-subtle`, `--border-strong`, `--border-hover`, `--border-active`, `--border-focus`, `--border-error`, `--ring-focus` |
| **Feedback** | `--tone-{intent}-*` | `--tone-danger-bg`, `--tone-danger-text`, `--tone-danger-border` (x6 intents: neutral/info/success/warning/danger/accent) |
| **State** | `--state-*` | `--state-focus-width`, `--state-focus-offset`, `--state-disabled-opacity` |
| **Shadows** | `--shadow-{n}` | `--shadow-1`, `--shadow-2`, `--shadow-3`, `--shadow-glow` |

Role-first naming. `--text` is clearer than `--fg`. `--border` is more intuitive than `--stroke` for UI. `--surface` with modifiers instead of separate `canvas`/`panel` namespaces. Unified `--tone-{intent}-*` pattern for badges and alerts. No primitive layer in CSS (theme blocks set semantic vars directly).

### Atlas (theme.css, index.css)

| Category | Pattern | Examples |
|----------|---------|----------|
| **Text** | `--fg-*` | `--fg`, `--fg-muted`, `--fg-subtle`, `--fg-faint`, `--fg-disabled`, `--fg-inverse` |
| **Surfaces** | `--canvas` + `--panel-*` | `--canvas`, `--panel`, `--panel-hover`, `--panel-selected`, `--panel-raised`, `--surface-report` |
| **Borders** | `--stroke-*` | `--stroke`, `--stroke-muted`, `--stroke-strong`, `--stroke-hover`, `--stroke-focus`, `--stroke-error` |
| **Feedback** | `--{status}-*` (split) | `--danger`, `--danger-bg`, `--danger-fg`, `--danger-stroke`, etc. (no unified tone pattern) |
| **State** | (none) | — |
| **Shadows** | `--shadow-{size}` | `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-footer`, `--shadow-glow` |

Tailwind exposes them via `index.css` `@theme` as `--color-fg`, `--color-panel`, etc. Used in: lab charts (`var(--fg)`), filter chips (theme.css), RSuite overrides, auth (`auth-*`), sidebar (IconButton), ReportPreviewModal (`surface-report`).

### Key differences

| Aspect | Cargoplan | Atlas | Recommendation |
|--------|-----------|-------|----------------|
| Text prefix | `--text-*` (role-first) | `--fg-*` (abstract) | **Adopt `--text-*`** — clearer |
| Text sub-names | `secondary`, `tertiary`, `muted` (ranked) | `muted`, `subtle`, `faint` (synonyms) | **Adopt ranked names** |
| Surface | `--surface-*` (unified) | `--canvas` + `--panel-*` (split) | **Adopt `--surface-*`** — single namespace |
| Borders | `--border-*` (intuitive) | `--stroke-*` (abstract) | **Adopt `--border-*`** — standard UI term |
| Feedback | `--tone-{intent}-*` (unified) | per-status split | **Add tone-* aliases** on top of existing tokens |
| Primitives | None in CSS | `--primitive-*` layer | **Keep primitives** — good for multi-theme flexibility |

---

## 2. How Theme Variables Are Used (Atlas)

| Area | Where used | Variables |
|------|-----------|-----------|
| **Foreground** | Lab chart tooltips/axes, filter chips, typography refs, all component text | `--fg`, `--fg-muted` (105 uses), `--fg-subtle` (149 uses), `--fg-faint` (40 uses), `--fg-disabled` (68 uses), `--fg-inverse` (4 uses) |
| **Canvas/Panel** | Tailwind `bg-canvas`, `bg-panel`, `bg-panel-hover`, filter chips, `--focus-offset` | `--canvas` (37 uses), `--panel`, `--panel-hover` (30 uses), `--panel-selected` (0 uses), `--panel-raised` (0 uses) |
| **Stroke** | Tailwind borders, filter chips, RSuite overrides | `--stroke`, `--stroke-muted`, `--stroke-strong` (28 uses), `--stroke-hover` (7 uses), `--stroke-focus` (2 uses), `--stroke-error` (3 uses) |
| **Brand** | Buttons, filter chip active, RSuite primary, active states | `--brand`, `--brand-hover`, `--brand-muted` (21 uses), `--brand-fg` (121 uses), `--on-brand` (31 uses) |
| **Feedback** | Badges, alerts, buttons (danger/success/warning/info), status indicators | `--danger-fg` (63 uses), `--danger-bg` (19), `--success-bg` (15), `--warning-bg` (16), `--warning-stroke` (14), `--danger-fg-emphasis` (12), etc. |
| **Chart** | RejectionChart, TATChart, VolumeChart, TATTrendChart, TestsOverTimeChart, TestsByDayBarChart, ActivityTrendChart, DistributionPieChart, StackedBarChart, CommandCenterView | `--chart-grid`, `--chart-axis`, `--chart-tooltip`, `--chart-tooltip-stroke` (and incorrect `--chart-tooltip-border`), `--chart-brand` (and incorrect `--chart-primary`), `--chart-accent`, `--chart-accent-muted` (and incorrect `--chart-accent-light`), `--chart-success`, `--chart-danger`, `--chart-warning` |
| **Auth** | LoginBrandingPanel, LoginFormCard (Tailwind classes like `text-auth-fg`, `bg-auth-panel`, `border-auth-stroke`) | Full `auth-*` set; missing `--auth-accent-medium` |
| **Sidebar** | IconButton (close/collapse) | `--sidebar-close-bg` (1 use), `--sidebar-close-fg` (1 use) |
| **Report** | ReportPreviewModal | `bg-surface-report` → `--surface-report` (1 use) |
| **Toast** | AppToastBar (dark-theme toast) | `--toast-*` (8 variables) |
| **Shadows** | Cards, modals, elevated surfaces, charts | `--shadow-sm` (35 uses), `--shadow-md` (12), `--shadow-lg` (13), `--shadow-footer` (3), `--shadow-glow` (0) |

---

## 3. Problems Found

### Problem 1: Text hierarchy uses synonyms instead of ranked words

```
--fg  →  --fg-muted  →  --fg-subtle  →  --fg-faint  →  --fg-disabled
```

**"Is muted lighter than subtle? Or is subtle lighter than muted?"** — Nobody can tell without checking theme.css. `text-fg-subtle` is the #1 most-used text token (149 uses), being used as the default secondary text — the name doesn't match the role.

### Problem 2: `stroke` is less intuitive than `border` for UI

Every UI framework (CSS, Tailwind, Bootstrap, Material) uses "border" for element edges. `--stroke` is an SVG concept. Developers must remember that `border-stroke-strong` means "strong border", not a stroke on a border.

### Problem 3: Split `canvas`/`panel` namespaces for surfaces

Two separate naming patterns (`--canvas` for page, `--panel-*` for components) when a single `--surface-*` namespace with modifiers (like cargoplan) is simpler and more consistent.

### Problem 4: Status token shapes are inconsistent

| Sub-token | danger | success | warning | info |
|-----------|--------|---------|---------|------|
| `--{s}` (solid) | yes | yes | yes | yes |
| `--{s}-hover` | yes | **no** | **no** | **no** |
| `--on-{s}` | yes | yes | yes | **no** |
| `--{s}-bg` | yes (19) | yes (15) | yes (16) | **no** |
| `--{s}-bg-emphasis` | yes (5) | yes (4) | yes (4) | **no** |
| `--{s}-fg` | yes (63) | yes (15) | yes (15) | **no** |
| `--{s}-fg-emphasis` | yes (12) | yes (11) | yes (10) | **no** |
| `--{s}-stroke` | yes (8) | yes (5) | yes (14) | **no** |
| `--{s}-stroke-emphasis` | yes (1) | **no** | yes (1) | **no** |

**Info is empty** — only `--info` and `--info-muted` exist (0 component uses for `--info-muted`).

### Problem 5: Undefined variables referenced in code

| Variable | Used in | Status |
|----------|---------|--------|
| `var(--chart-tooltip-border)` | Chart components | **UNDEFINED** — theme has `--chart-tooltip-stroke` |
| `var(--chart-primary)` | `VolumeChart.tsx` (2x), `TATChart.tsx` (1x) | **UNDEFINED** — theme has `--chart-brand` |
| `var(--chart-accent-light)` | `TestsOverTimeChart.tsx` (1x) | **UNDEFINED** — theme has `--chart-accent-muted` |
| `bg-auth-accent-medium` | `LoginBrandingPanel.tsx`, `LoginFormCard.tsx` | **UNDEFINED** — theme only has `--auth-accent`, `--auth-accent-hover` |

### Problem 6: Dead variables (defined but never consumed)

| Variable | Uses | Action |
|----------|------|--------|
| `--focus-offset` | 0 | Delete |
| `--shadow-glow` | 0 | Delete |
| `--info-muted` | 0 | Delete (replaced by proper `--info-*` set) |
| `--secondary`, `--secondary-hover`, `--secondary-fg` | 0 component uses | Delete entire set |
| `--sidebar-close-bg`, `--sidebar-close-fg` | 1 each | Delete — inline in `IconButton.tsx` |

### Problem 7: index.css has a duplicate alias

```css
--color-stroke-subtle: var(--stroke-muted);  /* line 46 — creates TWO Tailwind names for same value */
```

Both `border-stroke-subtle` and `border-stroke-muted` work in Tailwind, pointing to the same value. Only one should exist.

### Problem 8: No unified feedback/tone pattern for badges and alerts

Badges and alerts repeat per-status classes manually. Cargoplan solves this with `--tone-{intent}-bg`, `--tone-{intent}-text`, `--tone-{intent}-border` — one pattern for all intents. Atlas should add this as an alias layer.

---

## 4. Recommended Renames & Mappings

Keep primitives (`--primitive-*`) as-is — they are internal. Change only semantic tokens and Tailwind mappings.

### 4.1 Foreground → text

| Current (theme.css) | Current (Tailwind) | New (theme.css) | New (Tailwind) | Occurrences |
|---------------------|--------------------|-----------------|----------------|-------------|
| `--fg` | `text-fg` | `--text` | `text-text` (*) | ~0 standalone |
| `--fg-muted` | `text-fg-muted` | `--text-secondary` | `text-secondary` | 105 |
| `--fg-subtle` | `text-fg-subtle` | `--text-tertiary` | `text-tertiary` | 149 |
| `--fg-faint` | `text-fg-faint` | `--text-muted` | `text-muted` | 40 |
| `--fg-disabled` | `text-fg-disabled` | `--text-disabled` | `text-disabled` | 68 |
| `--fg-inverse` | `text-fg-inverse` | `--text-inverse` | `text-inverse` | 4 |

(*) For the primary text token `--text`, Tailwind generates `text-text` which reads oddly. In `index.css`, map it as `--color-text-primary: var(--text)` → Tailwind class: `text-primary`. Or keep `--color-fg: var(--text)` → `text-fg` as a compatibility alias.

**Impact**: theme.css (all theme blocks), index.css (`--color-fg*`), all components using `text-fg-*`, `var(--fg)` (lab charts, filter chips).
**Search**: `fg`, `--fg`, `text-fg`, `color-fg`.

### 4.2 Canvas / Panel → surface

| Current | New | Role | Occurrences |
|---------|-----|------|-------------|
| `--canvas` | `--surface-page` | Page/app background | 37 |
| `--panel` | `--surface` | Default component surface | used via `bg-panel` |
| `--panel-hover` | `--surface-hover` | Hover state | 30 |
| `--panel-selected` | `--surface-selected` | Selected state | 0 (keep for future) |
| `--panel-raised` | `--surface-elev` | Elevated surface | 0 (keep for future) |
| `--surface-report` | `--surface-report` | Report background | 1 (keep, name is clear) |

**Impact**: theme.css, index.css, filter-chip classes, all `bg-canvas`/`bg-panel` usage, `--focus-offset`.

### 4.3 Stroke → border

| Current | New | Occurrences |
|---------|-----|-------------|
| `--stroke` | `--border` | heavy |
| `--stroke-muted` | `--border-subtle` | low |
| `--stroke-strong` | `--border-strong` | 28 |
| `--stroke-hover` | `--border-hover` | 7 |
| `--stroke-focus` | `--border-focus` | 2 |
| `--stroke-error` | `--border-error` | 3 |

**Impact**: theme.css, index.css (`--color-stroke*`), RSuite overrides (e.g. `!border-stroke-strong` → `!border-strong`), filter chips.

### 4.4 Feedback: add `tone-*` layer

Keep existing `--danger`, `--danger-bg`, `--danger-fg`, etc. for buttons/inputs. Add aliases for badges/alerts:

```css
/* Aliases — one pattern for all intents */
--tone-danger-bg:     var(--danger-bg);
--tone-danger-text:   var(--danger-fg);
--tone-danger-border: var(--danger-stroke);

--tone-success-bg:     var(--success-bg);
--tone-success-text:   var(--success-fg);
--tone-success-border: var(--success-stroke);

--tone-warning-bg:     var(--warning-bg);
--tone-warning-text:   var(--warning-fg);
--tone-warning-border: var(--warning-stroke);

--tone-info-bg:     var(--info-bg);
--tone-info-text:   var(--info-fg);
--tone-info-border: var(--info-stroke);

--tone-neutral-bg:     var(--surface-hover);      /* or panel-hover equivalent */
--tone-neutral-text:   var(--text-secondary);
--tone-neutral-border: var(--border);

--tone-accent-bg:     var(--brand-muted);
--tone-accent-text:   var(--brand-fg);
--tone-accent-border: var(--brand);
```

Badge/alert components can then use `tone-*` for a single pattern, matching cargoplan's `status.ts` approach. This is purely additive — no breaking changes.

### 4.5 Chart: fix bugs and add missing vars

| Action | Variable | Resolution |
|--------|----------|------------|
| Define | `--chart-tooltip-border` | `= var(--chart-tooltip-stroke)` (or rename stroke → border and use one name) |
| Define | `--chart-primary` | `= var(--chart-brand)` (alias) |
| Define | `--chart-accent-light` | `= var(--chart-accent-muted)` (alias, or define lighter shade if design needs it) |

**Preferred**: define aliases in theme.css now, optionally clean up chart components later to use canonical names only.

### 4.6 Auth: add missing variable

Define `--auth-accent-medium` (between `--auth-accent` and `--auth-accent-hover`). Used by `LoginBrandingPanel.tsx`, `LoginFormCard.tsx`.

```css
/* :root (light) — auth is always dark-themed */
--auth-accent-medium: #4a6b78;

/* [data-theme="github"] */
--auth-accent-medium: var(--primitive-brand-600);

/* [data-theme="noir-studio"] */
--auth-accent-medium: var(--primitive-brand-600);
```

Map in index.css:
```css
--color-auth-accent-medium: var(--auth-accent-medium);
```

### 4.7 Shadows (optional)

Add numeric aliases for cargoplan-style naming:

```css
--shadow-1: var(--shadow-sm);
--shadow-2: var(--shadow-md);
--shadow-3: var(--shadow-lg);
```

Keep existing `--shadow-sm`/`--shadow-md`/`--shadow-lg` as primary names. Aliases are optional convenience.

### 4.8 What to keep, delete, or consolidate

| Token | Action |
|-------|--------|
| Primitives (`--primitive-*`) | **Keep** — internal, no rename needed |
| `--surface-report` | **Keep** — single use in ReportPreviewModal, name is clear under new `--surface-*` namespace |
| `--secondary`, `--secondary-hover`, `--secondary-fg` | **Delete** — 0 component uses |
| `--focus-offset` | **Delete** — 0 uses |
| `--shadow-glow` | **Delete** — 0 uses |
| `--info-muted` | **Delete** — replaced by `--info-fg` in status normalization |
| `--sidebar-close-bg`, `--sidebar-close-fg` | **Delete** — 1 use each, inline in IconButton |

**Consolidation strategy**: When introducing `--text-*`, you can deprecate `--fg-*` by keeping `--fg: var(--text)` as a temporary alias, then remove `--fg-*` references in a single grep pass. Same approach for `stroke → border` and `canvas/panel → surface`.

---

## 5. Refactoring Phases

### Phase 1: Fix Bugs (no renames)

**Risk**: Low — additive changes only
**Effort**: Small

#### 1a. Define missing chart variables in theme.css

Add to `:root`, `[data-theme="github"]`, `[data-theme="noir-studio"]`:

```css
--chart-tooltip-border: var(--chart-tooltip-stroke);
--chart-primary: var(--chart-brand);
--chart-accent-light: var(--chart-accent-muted);
```

Add to `index.css` `@theme`:

```css
--color-chart-tooltip-border: var(--chart-tooltip-border);
--color-chart-primary: var(--chart-primary);
--color-chart-accent-light: var(--chart-accent-light);
```

Optionally: fix chart components to use `--chart-tooltip-stroke` and `--chart-brand` directly, then remove the aliases.

#### 1b. Define missing auth variable

Add `--auth-accent-medium` to theme.css (all 3 themes) and index.css as described in section 4.6.

#### 1c. Remove `--stroke-subtle` alias from index.css

```diff
- --color-stroke-subtle: var(--stroke-muted);
```

Find-and-replace in components: `border-stroke-subtle` → `border-stroke-muted`.

#### 1d. Build + verify

---

### Phase 2: Rename `stroke` → `border`

**Risk**: Medium — high intuition gain, moderate occurrence count
**Effort**: Medium (scripted find-and-replace)

#### Rename map

| Current (theme.css) | New (theme.css) | Current (Tailwind) | New (Tailwind) |
|---------------------|-----------------|--------------------|-----------------------|
| `--stroke` | `--border` | `border-stroke` | `border-border` (*) |
| `--stroke-muted` | `--border-subtle` | `border-stroke-muted` | `border-subtle` |
| `--stroke-strong` | `--border-strong` | `border-stroke-strong` | `border-strong` |
| `--stroke-hover` | `--border-hover` | `border-stroke-hover` | `border-hover` |
| `--stroke-focus` | `--border-focus` | `border-stroke-focus` | `border-focus` |
| `--stroke-error` | `--border-error` | `border-stroke-error` | `border-error` |

(*) For the base `--border` token, Tailwind would generate `border-border` which reads oddly. In `index.css`, map it as `--color-border-default: var(--border)` → `border-default`, or keep `--color-stroke: var(--border)` → `border-stroke` as a transitional alias.

#### Files to update

1. `theme.css` — variable definitions in all 3 theme blocks
2. `index.css` — `@theme` `--color-stroke*` → `--color-border*` mappings
3. All `.tsx`/`.ts`/`.css` files — Tailwind class names (`border-stroke-*` → `border-*`)
4. RSuite overrides in `index.css` (e.g. `!border-stroke-strong` → `!border-strong`)
5. Filter chip classes in `theme.css` (`var(--stroke)` → `var(--border)`, etc.)

#### Execution

```bash
# Rename in theme.css and index.css first (manual or targeted sed)
# Then bulk rename in components:
find src -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.css' \) \
  -exec sed -i '' \
    -e 's/stroke-strong/border-strong/g' \
    -e 's/stroke-muted/border-subtle/g' \
    -e 's/stroke-hover/border-hover/g' \
    -e 's/stroke-focus/border-focus/g' \
    -e 's/stroke-error/border-error/g' \
    -e 's/stroke-error/border-error/g' \
  {} +
# Handle base --stroke → --border carefully (avoid hitting stroke-* variants)
```

> **Warning**: `stroke` appears in SVG contexts too. Use targeted replacements, not blind `s/stroke/border/g`. Audit with `grep -rn 'stroke' src/` first.

---

### Phase 3: Rename `fg` → `text`

**Risk**: Medium — 366+ occurrences, high intuition gain
**Effort**: Large (scripted)

#### Rename map

| Current (theme.css) | New (theme.css) | Current (Tailwind) | New (Tailwind) | Occurrences |
|---------------------|-----------------|--------------------|-----------------------|-------------|
| `--fg` | `--text` | `text-fg` | `text-primary` (*) | ~0 |
| `--fg-muted` | `--text-secondary` | `text-fg-muted` | `text-secondary` | 105 |
| `--fg-subtle` | `--text-tertiary` | `text-fg-subtle` | `text-tertiary` | 149 |
| `--fg-faint` | `--text-muted` | `text-fg-faint` | `text-muted` | 40 |
| `--fg-disabled` | `--text-disabled` | `text-fg-disabled` | `text-disabled` | 68 |
| `--fg-inverse` | `--text-inverse` | `text-fg-inverse` | `text-inverse` | 4 |

(*) Map `--text` in index.css as `--color-text-primary: var(--text)` → Tailwind: `text-primary`.

#### Execution order (critical — avoids collisions)

Because `--fg-muted` → `--text-secondary` and `--fg-faint` → `--text-muted`, order matters:

```
Step 1: fg-muted    → text-secondary     (in all files)
Step 2: fg-subtle   → text-tertiary      (in all files)
Step 3: fg-faint    → text-muted         (safe — old fg-muted already renamed)
Step 4: fg-disabled → text-disabled      (in all files)
Step 5: fg-inverse  → text-inverse       (in all files)
Step 6: fg          → text               (base token — careful, targeted only)
```

#### Files to update

1. `theme.css` — variable definitions in all 3 theme blocks
2. `index.css` — `@theme` `--color-fg*` → `--color-text*` mappings
3. All `.tsx` files — Tailwind class names
4. All `.ts` files — string references (typography.ts, lab-styles.ts, badgeHelpers.ts)
5. All `.css` files — any direct `var(--fg-*)` usage (filter chips, etc.)
6. Lab chart components — inline `var(--fg)` → `var(--text)`

#### Rename script

```bash
# Step 1: fg-muted → text-secondary (FIRST — before fg-faint takes the "muted" slot)
find src -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.css' \) \
  -exec sed -i '' 's/fg-muted/text-secondary/g' {} +

# Step 2: fg-subtle → text-tertiary
find src -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.css' \) \
  -exec sed -i '' 's/fg-subtle/text-tertiary/g' {} +

# Step 3: fg-faint → text-muted (safe now)
find src -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.css' \) \
  -exec sed -i '' 's/fg-faint/text-muted/g' {} +

# Step 4: fg-disabled → text-disabled
find src -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.css' \) \
  -exec sed -i '' 's/fg-disabled/text-disabled/g' {} +

# Step 5: fg-inverse → text-inverse
find src -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.css' \) \
  -exec sed -i '' 's/fg-inverse/text-inverse/g' {} +

# Step 6: base --fg → --text (targeted — only in theme.css, index.css, and var(--fg) usages)
# Do NOT blindly replace "fg" — it appears in other contexts
```

> **Warning**: Verify no string like `fg-muted-something` exists before running. Use `grep -rn 'fg-muted' src/` to audit first.

---

### Phase 4: Rename `canvas`/`panel` → `surface`

**Risk**: Medium — moderate occurrence count
**Effort**: Medium (scripted)

#### Rename map

| Current (theme.css) | New (theme.css) | Current (Tailwind) | New (Tailwind) | Occurrences |
|---------------------|-----------------|--------------------|-----------------------|-------------|
| `--canvas` | `--surface-page` | `bg-canvas` | `bg-surface-page` | 37 |
| `--panel` | `--surface` | `bg-panel` | `bg-surface` | moderate |
| `--panel-hover` | `--surface-hover` | `bg-panel-hover` | `bg-surface-hover` | 30 |
| `--panel-selected` | `--surface-selected` | `bg-panel-selected` | `bg-surface-selected` | 0 |
| `--panel-raised` | `--surface-elev` | `bg-panel-raised` | `bg-surface-elev` | 0 |
| `--surface-report` | `--surface-report` | `bg-surface-report` | `bg-surface-report` | 1 (keep) |

#### Files to update

1. `theme.css` — variable definitions in all 3 theme blocks
2. `index.css` — `@theme` `--color-canvas/panel*` → `--color-surface*` mappings
3. All `.tsx`/`.ts`/`.css` files — Tailwind class names
4. Filter chip classes in theme.css — `var(--panel)` → `var(--surface)`, etc.
5. `--focus-offset` definition — currently `var(--panel)` → `var(--surface)`

#### Execution

```bash
# Order matters: specific → general
# Step 1: panel-selected → surface-selected
# Step 2: panel-raised → surface-elev
# Step 3: panel-hover → surface-hover
# Step 4: panel → surface (base — careful with panel-* variants)
# Step 5: canvas → surface-page
```

---

### Phase 5: Add `tone-*` layer for badges/alerts

**Risk**: Low — purely additive (aliases to existing tokens)
**Effort**: Small

Add to `theme.css` (`:root` only — inherits to dark themes via the values they already override):

```css
/* ═══════════════════════════════════════════════════════════════════
   TONE SYSTEM (Unified feedback pattern for badges/alerts)
   Usage: bg-tone-danger-bg, text-tone-danger-text, border-tone-danger-border
   ═══════════════════════════════════════════════════════════════════ */
--tone-neutral-bg:     var(--surface-hover);
--tone-neutral-text:   var(--text-secondary);
--tone-neutral-border: var(--border);

--tone-info-bg:     var(--info-bg);
--tone-info-text:   var(--info-fg);
--tone-info-border: var(--info-stroke);

--tone-success-bg:     var(--success-bg);
--tone-success-text:   var(--success-fg);
--tone-success-border: var(--success-stroke);

--tone-warning-bg:     var(--warning-bg);
--tone-warning-text:   var(--warning-fg);
--tone-warning-border: var(--warning-stroke);

--tone-danger-bg:     var(--danger-bg);
--tone-danger-text:   var(--danger-fg);
--tone-danger-border: var(--danger-stroke);

--tone-accent-bg:     var(--brand-muted);
--tone-accent-text:   var(--brand-fg);
--tone-accent-border: var(--brand);
```

Add to `index.css` `@theme`:

```css
/* Tone system */
--color-tone-neutral-bg: var(--tone-neutral-bg);
--color-tone-neutral-text: var(--tone-neutral-text);
--color-tone-neutral-border: var(--tone-neutral-border);
--color-tone-info-bg: var(--tone-info-bg);
--color-tone-info-text: var(--tone-info-text);
--color-tone-info-border: var(--tone-info-border);
--color-tone-success-bg: var(--tone-success-bg);
--color-tone-success-text: var(--tone-success-text);
--color-tone-success-border: var(--tone-success-border);
--color-tone-warning-bg: var(--tone-warning-bg);
--color-tone-warning-text: var(--tone-warning-text);
--color-tone-warning-border: var(--tone-warning-border);
--color-tone-danger-bg: var(--tone-danger-bg);
--color-tone-danger-text: var(--tone-danger-text);
--color-tone-danger-border: var(--tone-danger-border);
--color-tone-accent-bg: var(--tone-accent-bg);
--color-tone-accent-text: var(--tone-accent-text);
--color-tone-accent-border: var(--tone-accent-border);
```

Then badge/alert components can migrate to use `tone-*` classes for a single pattern:

```tsx
// Before (per-status manual mapping):
const toneClasses = {
  danger:  "bg-danger-bg text-danger-fg border-danger-stroke",
  success: "bg-success-bg text-success-fg border-success-stroke",
  // ...
};

// After (unified pattern):
const toneClasses = (intent: Tone) =>
  `bg-tone-${intent}-bg text-tone-${intent}-text border-tone-${intent}-border`;
```

---

### Phase 6: Normalize status token shapes

**Risk**: Low — additive
**Effort**: Medium

#### 6a. Complete the info token set

Add to `theme.css` (all 3 theme blocks):

```css
/* :root (light) */
--info-bg: rgba(139, 92, 246, 0.08);
--info-bg-emphasis: rgba(139, 92, 246, 0.15);
--info-fg: var(--primitive-info-500);
--info-fg-emphasis: var(--primitive-info-400);
--info-stroke: rgba(139, 92, 246, 0.25);

/* [data-theme="github"] */
--info-bg: rgba(31, 111, 235, 0.15);
--info-bg-emphasis: rgba(31, 111, 235, 0.25);
--info-fg: var(--primitive-info-500);
--info-fg-emphasis: var(--primitive-info-400);
--info-stroke: rgba(31, 111, 235, 0.30);

/* [data-theme="noir-studio"] */
--info-bg: rgba(31, 111, 235, 0.15);
--info-bg-emphasis: rgba(31, 111, 235, 0.25);
--info-fg: var(--primitive-info-500);
--info-fg-emphasis: var(--primitive-info-400);
--info-stroke: rgba(31, 111, 235, 0.30);
```

Add to `index.css` `@theme`:

```css
--color-info-bg: var(--info-bg);
--color-info-bg-emphasis: var(--info-bg-emphasis);
--color-info-fg: var(--info-fg);
--color-info-fg-emphasis: var(--info-fg-emphasis);
--color-info-stroke: var(--info-stroke);
```

#### 6b. Add missing hover/stroke-emphasis tokens

```css
/* :root (light) */
--success-hover: var(--primitive-success-700);
--success-stroke-emphasis: var(--primitive-success-600);
--warning-hover: var(--primitive-warning-600);
--on-info: var(--primitive-neutral-0);

/* [data-theme="github"] and [data-theme="noir-studio"] */
--success-hover: var(--primitive-success-600);
--success-stroke-emphasis: var(--primitive-success-500);
--warning-hover: var(--primitive-warning-600);
--on-info: var(--primitive-neutral-900);
```

Add to `index.css`:

```css
--color-success-hover: var(--success-hover);
--color-success-stroke-emphasis: var(--success-stroke-emphasis);
--color-warning-hover: var(--warning-hover);
--color-on-info: var(--on-info);
```

#### Final uniform status shape (all 4 statuses)

```
--{s}                    solid bg for buttons
--{s}-hover              button hover
--on-{s}                 text on solid bg
--{s}-bg                 feedback/alert bg (light tint)
--{s}-bg-emphasis        stronger feedback bg
--{s}-fg                 colored text
--{s}-fg-emphasis        stronger colored text
--{s}-stroke             feedback border
--{s}-stroke-emphasis    stronger feedback border
```

9 tokens x 4 statuses = 36 status tokens.

---

### Phase 7: Delete dead tokens

**Risk**: Low — unused code removal
**Effort**: Small

#### Remove from theme.css (all three theme blocks)

| Variable | Reason |
|----------|--------|
| `--focus-offset` | 0 uses |
| `--shadow-glow` | 0 uses |
| `--info-muted` | 0 uses, replaced by `--info-fg` in Phase 6 |
| `--secondary` | 0 component uses |
| `--secondary-hover` | 0 component uses |
| `--secondary-fg` | 0 component uses |
| `--sidebar-close-bg` | 1 use — inline as `bg-surface-hover` in IconButton.tsx |
| `--sidebar-close-fg` | 1 use — inline as `text-secondary` in IconButton.tsx |

#### Remove from index.css `@theme`

```diff
- --color-secondary: var(--secondary);
- --color-secondary-hover: var(--secondary-hover);
- --color-secondary-fg: var(--secondary-fg);
- --color-info-muted: var(--info-muted);
```

#### Update IconButton.tsx

Replace `bg-sidebar-close` / `text-sidebar-close-fg` with `bg-surface-hover` / `text-secondary` (using new names from Phases 3-4).

---

### Phase 8: Optional — shadow aliases, disabled opacity

**Risk**: Low — additive only
**Effort**: Small

#### 8a. Shadow numeric aliases

```css
/* theme.css — optional cargoplan-style aliases */
--shadow-1: var(--shadow-sm);
--shadow-2: var(--shadow-md);
--shadow-3: var(--shadow-lg);
```

Keep `--shadow-sm`/`--shadow-md`/`--shadow-lg` as primary names.

#### 8b. Disabled opacity token

```css
/* theme.css */
--state-disabled-opacity: 0.5;
```

```css
/* index.css */
--opacity-disabled: var(--state-disabled-opacity);
```

Usage: `opacity-disabled` instead of hardcoded `opacity-50`.

---

## 6. Token Flow Diagram (After Refactor)

```
Primitives (theme.css)                 Semantic tokens (theme.css)
─────────────────────                  ─────────────────────────────
primitive-brand-*     ──────────────►  brand / brand-hover / on-brand
primitive-neutral-*   ──────────────►  text / text-secondary / text-muted
                      ──────────────►  surface / surface-page / surface-hover
                      ──────────────►  border / border-subtle / border-focus
primitive-danger-*    ──────────────►  danger / danger-bg / danger-fg
primitive-success-*   ──────────────►  success / success-bg / success-fg
primitive-warning-*   ──────────────►  warning / warning-bg / warning-fg
primitive-info-*      ──────────────►  info / info-bg / info-fg
                                       │
                                       ▼
                                  Tone aliases (theme.css)
                                  ────────────────────────
                                  tone-danger-bg / tone-danger-text / tone-danger-border
                                  tone-success-bg / tone-success-text / tone-success-border
                                  tone-warning-bg / tone-warning-text / tone-warning-border
                                  tone-info-bg / tone-info-text / tone-info-border
                                  tone-neutral-bg / tone-neutral-text / tone-neutral-border
                                  tone-accent-bg / tone-accent-text / tone-accent-border
                                       │
                                       ▼
                                  Tailwind mapping (index.css @theme)
                                  ──────────────────────────────────
                                  --color-text-primary: var(--text)
                                  --color-text-secondary: var(--text-secondary)
                                  --color-surface: var(--surface)
                                  --color-surface-page: var(--surface-page)
                                  --color-border-default: var(--border)
                                  --color-border-subtle: var(--border-subtle)
                                  --color-tone-danger-bg: var(--tone-danger-bg)
                                  ...
                                       │
                                       ▼
                                  Components (Tailwind classes)
                                  ────────────────────────────
                                  text-secondary bg-surface border-default
                                  bg-tone-danger-bg text-tone-danger-text
```

---

## 7. Migration Checklist

### Pre-flight

- [ ] Create branch: `refactor/theme-tokens`
- [ ] `npm run build` — confirm clean baseline
- [ ] Grep audit: count all `fg-muted`, `fg-subtle`, `fg-faint`, `stroke`, `canvas`, `panel` occurrences
- [ ] Check for `fg-muted-something` or `stroke-something` compound names that could collide

### Phase 1 — Bugs

- [ ] Add `--chart-tooltip-border`, `--chart-primary`, `--chart-accent-light` to theme.css (all 3 themes)
- [ ] Add corresponding `--color-chart-*` to index.css
- [ ] Add `--auth-accent-medium` to theme.css (all 3 themes) + index.css
- [ ] Remove `--color-stroke-subtle` alias from index.css
- [ ] Replace `border-stroke-subtle` → `border-stroke-muted` in components
- [ ] Build + verify

### Phase 2 — `stroke` → `border`

- [ ] Rename in theme.css (all 3 theme blocks)
- [ ] Rename in index.css `@theme` mappings
- [ ] Rename in filter chip classes (theme.css)
- [ ] Rename in RSuite overrides (index.css)
- [ ] Bulk rename in all `.tsx`/`.ts`/`.css` files
- [ ] Build + verify

### Phase 3 — `fg` → `text`

- [ ] Step 1: `fg-muted` → `text-secondary`
- [ ] Step 2: `fg-subtle` → `text-tertiary`
- [ ] Step 3: `fg-faint` → `text-muted`
- [ ] Step 4: `fg-disabled` → `text-disabled`
- [ ] Step 5: `fg-inverse` → `text-inverse`
- [ ] Step 6: base `--fg` → `--text` (targeted)
- [ ] Update theme.css, index.css, filter chips, lab charts
- [ ] Build + verify
- [ ] Visual spot-check: Dashboard, Lab page, Patient detail, Order modal

### Phase 4 — `canvas`/`panel` → `surface`

- [ ] Rename in theme.css (all 3 theme blocks)
- [ ] Rename in index.css `@theme` mappings
- [ ] Rename in filter chips (theme.css)
- [ ] Bulk rename in all `.tsx`/`.ts`/`.css` files
- [ ] Build + verify

### Phase 5 — Add `tone-*` layer

- [ ] Add `--tone-*` aliases in theme.css
- [ ] Add `--color-tone-*` in index.css
- [ ] Build + verify
- [ ] Optionally migrate badge/alert components to use `tone-*` classes

### Phase 6 — Status normalization

- [ ] Add info token set to theme.css (all 3 themes) + index.css
- [ ] Add `--success-hover`, `--success-stroke-emphasis`, `--warning-hover`, `--on-info`
- [ ] Build + verify

### Phase 7 — Cleanup

- [ ] Delete dead variables from theme.css (all 3 themes)
- [ ] Delete dead mappings from index.css
- [ ] Update `IconButton.tsx` — inline sidebar-close replacements
- [ ] Build + verify

### Phase 8 — Optional

- [ ] Add shadow numeric aliases
- [ ] Add `--state-disabled-opacity` + `--opacity-disabled`
- [ ] Build + verify

### Post-flight

- [ ] Full visual regression across all 3 themes (light, github, noir-studio)
- [ ] Grep for stale names: `var(--fg)`, `var(--stroke)`, `var(--panel)`, `var(--canvas)`, `var(--secondary)` — should be 0
- [ ] Update design documentation if any exists

---

## 8. Full Variable Reference (Before/After)

### Text

| Before | After | Role | Light | Dark (github) |
|--------|-------|------|-------|----------------|
| `--fg` | `--text` | Primary text | neutral-900 | #FFFFFF |
| `--fg-muted` | `--text-secondary` | Labels, secondary content | neutral-600 | #CACACA |
| `--fg-subtle` | `--text-tertiary` | Metadata, timestamps | neutral-500 | #8B949E |
| `--fg-faint` | `--text-muted` | Placeholders, hints | neutral-400 | #6E7681 |
| `--fg-disabled` | `--text-disabled` | Disabled controls | neutral-300 | #484F58 |
| `--fg-inverse` | `--text-inverse` | Text on dark bg | neutral-0 | #0B0F16 |

### Surfaces

| Before | After | Role |
|--------|-------|------|
| `--canvas` | `--surface-page` | Page/app background |
| `--panel` | `--surface` | Default component bg |
| `--panel-hover` | `--surface-hover` | Hover state |
| `--panel-selected` | `--surface-selected` | Selected state |
| `--panel-raised` | `--surface-elev` | Elevated surface |
| `--surface-report` | `--surface-report` | Report background (keep) |

### Borders

| Before | After | Role |
|--------|-------|------|
| `--stroke` | `--border` | Default border |
| `--stroke-muted` | `--border-subtle` | Subtle divider |
| `--stroke-strong` | `--border-strong` | Emphasized border |
| `--stroke-hover` | `--border-hover` | Hover border |
| `--stroke-focus` | `--border-focus` | Focus ring |
| `--stroke-error` | `--border-error` | Error border |

### Brand (unchanged)

| Token | Role |
|-------|------|
| `--brand` | Primary action color |
| `--brand-hover` | Button hover |
| `--brand-muted` | Light tint background |
| `--brand-fg` | Brand-colored text |
| `--on-brand` | Text on brand bg |

### Status Colors (uniform shape after Phase 6)

| Token pattern | danger | success | warning | info |
|---------------|--------|---------|---------|------|
| `--{s}` | keep | keep | keep | keep |
| `--{s}-hover` | keep | **new** | **new** | — |
| `--on-{s}` | keep | keep | keep | **new** |
| `--{s}-bg` | keep | keep | keep | **new** |
| `--{s}-bg-emphasis` | keep | keep | keep | **new** |
| `--{s}-fg` | keep | keep | keep | **new** |
| `--{s}-fg-emphasis` | keep | keep | keep | **new** |
| `--{s}-stroke` | keep | keep | keep | **new** |
| `--{s}-stroke-emphasis` | keep | **new** | keep | — |

### Tone Layer (new)

| Token | Maps to |
|-------|---------|
| `--tone-neutral-bg` | `var(--surface-hover)` |
| `--tone-neutral-text` | `var(--text-secondary)` |
| `--tone-neutral-border` | `var(--border)` |
| `--tone-info-bg` | `var(--info-bg)` |
| `--tone-info-text` | `var(--info-fg)` |
| `--tone-info-border` | `var(--info-stroke)` |
| `--tone-success-bg` | `var(--success-bg)` |
| `--tone-success-text` | `var(--success-fg)` |
| `--tone-success-border` | `var(--success-stroke)` |
| `--tone-warning-bg` | `var(--warning-bg)` |
| `--tone-warning-text` | `var(--warning-fg)` |
| `--tone-warning-border` | `var(--warning-stroke)` |
| `--tone-danger-bg` | `var(--danger-bg)` |
| `--tone-danger-text` | `var(--danger-fg)` |
| `--tone-danger-border` | `var(--danger-stroke)` |
| `--tone-accent-bg` | `var(--brand-muted)` |
| `--tone-accent-text` | `var(--brand-fg)` |
| `--tone-accent-border` | `var(--brand)` |

### Deleted

| Variable | Reason |
|----------|--------|
| `--focus-offset` | 0 uses |
| `--shadow-glow` | 0 uses |
| `--info-muted` | Replaced by `--info-fg` |
| `--secondary` | 0 component uses |
| `--secondary-hover` | 0 component uses |
| `--secondary-fg` | 0 component uses |
| `--sidebar-close-bg` | 1 use → inline |
| `--sidebar-close-fg` | 1 use → inline |

### New (non-tone, non-status)

| Variable | Role |
|----------|------|
| `--chart-tooltip-border` | Chart tooltip border (alias to `--chart-tooltip-stroke`) |
| `--chart-primary` | Primary chart color (alias to `--chart-brand`) |
| `--chart-accent-light` | Light chart accent (alias to `--chart-accent-muted`) |
| `--auth-accent-medium` | Auth accent midpoint |
| `--state-disabled-opacity` | Global disabled opacity (optional) |

---

## Summary

| Phase | What | Effort | Risk |
|-------|------|--------|------|
| 1. Fix bugs | Chart aliases, auth-accent-medium, remove stroke-subtle alias | Small | Low |
| 2. `stroke` → `border` | 6 variable renames + component updates | Medium | Medium |
| 3. `fg` → `text` | 6 variable renames, ~366 occurrences | Large | Medium |
| 4. `canvas`/`panel` → `surface` | 5 variable renames, ~67+ occurrences | Medium | Medium |
| 5. Add `tone-*` layer | 18 new alias tokens | Small | Low |
| 6. Status normalization | ~13 new tokens (info set, hover/stroke gaps) | Medium | Low |
| 7. Delete dead tokens | ~8 variables removed | Small | Low |
| 8. Optional extras | Shadow aliases, disabled opacity | Small | Low |

**Total new tokens**: ~34 (18 tone + 13 status + 3 chart/auth)
**Total deleted tokens**: ~8
**Total renamed tokens**: ~17
**Net token count change**: +26 (but 18 are tone aliases pointing to existing values)

All renames require a single pass of theme.css (and each dark theme block), then index.css, then grep-based updates in components and RSuite overrides. The consolidation approach (keep old names as aliases → migrate → remove aliases) minimizes risk for each phase.
