# Atlas Design System - Complete Theme Refactoring Plan

> **Author**: Design System Architect
> **Date**: February 2026
> **Scope**: Complete theme architecture redesign from scratch

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Token Architecture Overview](#2-token-architecture-overview)
3. [Component Taxonomy](#3-component-taxonomy)
4. [Level 1: Primitive Tokens (theme.css)](#4-level-1-primitive-tokens-themecss)
5. [Level 2: Semantic Tokens (theme.css)](#5-level-2-semantic-tokens-themecss)
6. [Level 3: Tailwind Integration (index.css)](#6-level-3-tailwind-integration-indexcss)
7. [Level 4: Component Token Usage](#7-level-4-component-token-usage)
8. [Complete Token Reference](#8-complete-token-reference)
9. [Migration Checklist](#9-migration-checklist)

---

## 1. Design Philosophy

### 1.1 Core Principles

1. **Semantic over Presentational**: Names describe *purpose*, not appearance
2. **No Redundancy**: Token names should not repeat the CSS property prefix
3. **Hierarchy is Clear**: Use consistent suffixes (-muted, -subtle, -emphasis) not numbers
4. **Single Source of Truth**: Each token defined once, referenced everywhere
5. **Theme-Agnostic Consumption**: Components use semantic names; themes swap values

### 1.2 Naming Convention

```
Pattern: {category}-{element}-{variant}

Categories: fg, panel, stroke, brand, status
Elements: (optional) button, input, badge
Variants: muted, subtle, emphasis, hover, on
```

### 1.3 Why These Names?

| Token Name | Rationale |
|------------|-----------|
| `fg` | "Foreground" - standard term for text/icon colors. Avoids `text-text` redundancy |
| `panel` | Component backgrounds (cards, modals). Avoids `bg-surface` which is vague |
| `canvas` | Page-level background. Distinct from component backgrounds |
| `stroke` | Borders and dividers. Avoids `border-border` redundancy |
| `brand` | Primary action color. Clear that it's "the" brand color |
| `-on-{color}` | Text color *on* a colored background (e.g., white on brand) |
| `-muted` | Reduced emphasis (secondary text, subtle borders) |
| `-subtle` | Even more reduced (tertiary text, very light borders) |
| `-emphasis` | Increased emphasis (stronger variant) |

---

## 2. Token Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT USAGE (TSX)                        │
│                                                                 │
│   <div className="bg-panel text-fg border-stroke">              │
│   <button className="bg-brand text-on-brand">                   │
│   <span className="text-fg-muted">                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              LEVEL 3: TAILWIND @theme (index.css)               │
│                                                                 │
│   --color-fg: var(--fg);                                        │
│   --color-panel: var(--panel);                                  │
│   --color-brand: var(--brand);                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│           LEVEL 2: SEMANTIC TOKENS (theme.css)                  │
│                                                                 │
│   --fg: var(--primitive-neutral-900);                           │
│   --panel: var(--primitive-neutral-0);                          │
│   --brand: var(--primitive-brand-600);                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│           LEVEL 1: PRIMITIVE TOKENS (theme.css)                 │
│                                                                 │
│   --primitive-brand-600: #0284c7;                               │
│   --primitive-neutral-900: #111827;                             │
│   --primitive-neutral-0: #ffffff;                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Taxonomy

Based on exhaustive codebase analysis (116+ components), here is the complete component categorization:

### 3.1 Category: INTERACTIVE (Actions & Controls)

Components that trigger actions or accept user input.

| Component | File | Subcategory | Tokens Required |
|-----------|------|-------------|-----------------|
| Button | `/shared/ui/forms/Button.tsx` | Action Trigger | brand, brand-hover, on-brand, danger, success, warning, secondary |
| IconButton | `/shared/ui/forms/IconButton.tsx` | Action Trigger | Same as Button |
| Input | `/shared/ui/forms/Input.tsx` | Data Entry | panel, stroke, stroke-hover, stroke-focus, fg, fg-muted |
| Textarea | `/shared/ui/forms/Input.tsx` | Data Entry | Same as Input |
| Select | `/shared/ui/forms/Input.tsx` | Data Entry | Same as Input |
| DateInput | `/shared/ui/forms/DateInput.tsx` | Data Entry | Same as Input + popover tokens |
| CheckboxList | `/shared/ui/forms/CheckboxList.tsx` | Selection | brand, stroke-strong, panel |
| TagInput | `/shared/ui/forms/TagInput.tsx` | Multi-Entry | panel, stroke, fg, tag tokens |
| MultiSelectFilter | `/shared/ui/forms/MultiSelectFilter.tsx` | Selection | panel, stroke, brand, popover tokens |

### 3.2 Category: CONTAINERS (Surfaces & Layout)

Components that contain other components.

| Component | File | Subcategory | Tokens Required |
|-----------|------|-------------|-----------------|
| Card | `/shared/ui/display/Card.tsx` | Surface | panel, stroke, panel-hover |
| Modal | `/shared/ui/overlay/Modal.tsx` | Overlay | panel, stroke, overlay, shadow |
| Popover | `/shared/ui/overlay/Popover.tsx` | Overlay | panel, stroke, shadow |
| SectionContainer | `/shared/ui/layout/SectionContainer.tsx` | Section | panel, stroke |
| TabbedSectionContainer | `/shared/ui/layout/TabbedSectionContainer.tsx` | Section | panel, stroke, brand (tabs) |
| AppLayout | `/shared/layout/AppLayout.tsx` | Page | canvas |
| Sidebar | `/shared/layout/Sidebar/index.tsx` | Navigation | panel, stroke |

### 3.3 Category: TYPOGRAPHY (Text Display)

Components primarily displaying text content.

| Component | File | Subcategory | Tokens Required |
|-----------|------|-------------|-----------------|
| DetailField | `/shared/ui/layout/DetailField.tsx` | Label-Value | fg, fg-muted, fg-subtle |
| DetailRow | `/shared/ui/layout/DetailRow.tsx` | Multi-Field | fg, fg-muted |
| DetailFieldGroup | `/shared/ui/layout/DetailFieldGroup.tsx` | Grouped | fg, stroke |
| InfoField | `/shared/components/sections/InfoField.tsx` | Label-Value | fg, fg-muted |
| EmptyState | `/shared/ui/display/EmptyState.tsx` | Placeholder | fg, fg-muted, fg-disabled |

### 3.4 Category: FEEDBACK (Status & Notifications)

Components that communicate status or feedback to users.

| Component | File | Subcategory | Tokens Required |
|-----------|------|-------------|-----------------|
| Badge | `/shared/ui/display/Badge.tsx` | Status Indicator | All status colors, badge-bg |
| Alert | `/shared/ui/display/Alert.tsx` | Notification | success-*, warning-*, danger-*, info-* |
| CircularProgress | `/shared/ui/feedback/CircularProgress.tsx` | Progress | brand, neutral-200 |
| LoadingSpinner | `/shared/ui/feedback/LoadingSpinner.tsx` | Loading | success-fg (default) |
| Skeleton | `/shared/ui/feedback/Skeleton.tsx` | Placeholder | neutral-200 |
| AppToastBar | `/shared/components/feedback/AppToastBar.tsx` | Toast | toast-* tokens |

### 3.5 Category: DATA DISPLAY (Tables & Lists)

Components that display collections of data.

| Component | File | Subcategory | Tokens Required |
|-----------|------|-------------|-----------------|
| Table | `/shared/ui/Table/Table.tsx` | Data Table | panel, stroke, canvas |
| TableCore | `/shared/ui/Table/TableCore.tsx` | Table Structure | panel, stroke, panel-hover |
| TableHeader | `/shared/ui/Table/TableHeader.tsx` | Header Row | canvas, stroke, fg-muted |
| TableRow | `/shared/ui/Table/TableRow.tsx` | Data Row | stroke, panel-hover |
| TableCell | `/shared/ui/Table/TableCell.tsx` | Cell | fg, status colors |
| CardGrid | `/shared/ui/Table/CardGrid.tsx` | Mobile List | Delegates to cards |
| Pagination | `/shared/ui/navigation/Pagination.tsx` | Navigation | brand, on-brand, fg-muted, panel-hover |

### 3.6 Category: NAVIGATION (Wayfinding)

Components for navigation and search.

| Component | File | Subcategory | Tokens Required |
|-----------|------|-------------|-----------------|
| Tabs | `/shared/ui/layout/Tabs.tsx` | Tab Navigation | brand, fg, fg-muted, canvas, panel |
| SearchBar | `/shared/ui/navigation/SearchBar.tsx` | Search | fg-muted, brand (hover) |
| SidebarNav | `/shared/layout/Sidebar/SidebarNav.tsx` | Menu | brand-muted, brand, fg-muted, panel-hover |
| TableActionMenu | `/shared/ui/navigation/TableActionMenu.tsx` | Context Menu | fg-muted, panel-hover, danger-fg |

### 3.7 Category: IDENTITY (User & Entity)

Components representing users or entities.

| Component | File | Subcategory | Tokens Required |
|-----------|------|-------------|-----------------|
| Avatar | `/shared/ui/display/Avatar.tsx` | Profile | brand, on-brand, fg, fg-subtle |
| SidebarProfile | `/shared/layout/Sidebar/SidebarProfile.tsx` | User Profile | panel, stroke, fg, fg-subtle |
| Icon | `/shared/ui/display/Icon.tsx` | Iconography | Inherits color from parent |

### 3.8 Category: DOMAIN-SPECIFIC

Feature-specific components with specialized styling.

| Component | File | Domain | Tokens Required |
|-----------|------|--------|-----------------|
| OrderCard | `/features/order/components/OrderCard.tsx` | Orders | All standard + status colors |
| PatientCard | `/features/patient/pages/PatientCard.tsx` | Patients | All standard + gender colors |
| LabCard | `/features/lab/components/collection/*.tsx` | Laboratory | All standard + sample colors |
| PaymentCard | `/features/payment/pages/PaymentCard.tsx` | Payments | All standard + payment status |
| CatalogCard | `/features/catalog/pages/CatalogCard.tsx` | Catalog | All standard + category colors |
| LoginFormCard | `/features/auth/components/LoginFormCard.tsx` | Auth | auth-* tokens (isolated) |

---

## 4. Level 1: Primitive Tokens (theme.css)

Primitives are raw color values. They have no semantic meaning.

### 4.1 Brand Palette

```css
:root {
  /* Brand - Primary action color */
  --primitive-brand-50: #f0f9ff;
  --primitive-brand-100: #e0f2fe;
  --primitive-brand-200: #bae6fd;
  --primitive-brand-300: #7dd3fc;
  --primitive-brand-400: #38bdf8;
  --primitive-brand-500: #0ea5e9;
  --primitive-brand-600: #0284c7;
  --primitive-brand-700: #0369a1;
  --primitive-brand-800: #075985;
  --primitive-brand-900: #0c4a6e;
  --primitive-brand-950: #082f49;
}
```

### 4.2 Neutral Palette

```css
:root {
  /* Neutral - Grays for text, borders, surfaces */
  --primitive-neutral-0: #ffffff;
  --primitive-neutral-50: #f9fafb;
  --primitive-neutral-100: #f3f4f6;
  --primitive-neutral-200: #e5e7eb;
  --primitive-neutral-300: #d1d5db;
  --primitive-neutral-400: #9ca3af;
  --primitive-neutral-500: #6b7280;
  --primitive-neutral-600: #4b5563;
  --primitive-neutral-700: #374151;
  --primitive-neutral-800: #1f2937;
  --primitive-neutral-900: #111827;
  --primitive-neutral-950: #030712;
}
```

### 4.3 Status Palettes

```css
:root {
  /* Success */
  --primitive-success-50: #f0fdf4;
  --primitive-success-100: #dcfce7;
  --primitive-success-200: #bbf7d0;
  --primitive-success-500: #22c55e;
  --primitive-success-600: #16a34a;
  --primitive-success-700: #15803d;
  --primitive-success-800: #166534;

  /* Warning */
  --primitive-warning-50: #fffbeb;
  --primitive-warning-100: #fef3c7;
  --primitive-warning-200: #fde68a;
  --primitive-warning-300: #fcd34d;
  --primitive-warning-500: #eab308;
  --primitive-warning-600: #ca8a04;
  --primitive-warning-700: #a16207;
  --primitive-warning-800: #854d0e;

  /* Danger */
  --primitive-danger-50: #fef2f2;
  --primitive-danger-100: #fee2e2;
  --primitive-danger-200: #fecaca;
  --primitive-danger-500: #ef4444;
  --primitive-danger-600: #dc2626;
  --primitive-danger-700: #b91c1c;
  --primitive-danger-800: #991b1b;

  /* Info (Purple accent) */
  --primitive-info-400: #a78bfa;
  --primitive-info-500: #8b5cf6;
}
```

---

## 5. Level 2: Semantic Tokens (theme.css)

Semantic tokens give *meaning* to primitives. They change per theme.

### 5.1 Complete Semantic Token Schema

```css
:root {
  /* ═══════════════════════════════════════════════════════════════════
     FOREGROUND (Text & Icons)
     Usage: text-fg, text-fg-muted, text-fg-subtle, etc.
     ═══════════════════════════════════════════════════════════════════ */
  --fg: var(--primitive-neutral-900);              /* Primary text */
  --fg-muted: var(--primitive-neutral-600);        /* Secondary text */
  --fg-subtle: var(--primitive-neutral-500);       /* Tertiary text */
  --fg-faint: var(--primitive-neutral-400);        /* Placeholder, hints */
  --fg-disabled: var(--primitive-neutral-300);     /* Disabled state */
  --fg-inverse: var(--primitive-neutral-0);        /* Text on dark bg */

  /* ═══════════════════════════════════════════════════════════════════
     CANVAS (Page Background)
     Usage: bg-canvas
     ═══════════════════════════════════════════════════════════════════ */
  --canvas: var(--primitive-neutral-50);

  /* ═══════════════════════════════════════════════════════════════════
     PANEL (Component Backgrounds)
     Usage: bg-panel, bg-panel-hover, bg-panel-selected
     ═══════════════════════════════════════════════════════════════════ */
  --panel: var(--primitive-neutral-0);             /* Default component bg */
  --panel-hover: var(--primitive-neutral-50);      /* Hover state */
  --panel-selected: var(--primitive-brand-100);    /* Selected state */
  --panel-raised: var(--primitive-neutral-0);      /* Elevated surface */

  /* ═══════════════════════════════════════════════════════════════════
     STROKE (Borders & Dividers)
     Usage: border-stroke, border-stroke-muted, border-stroke-strong
     ═══════════════════════════════════════════════════════════════════ */
  --stroke: var(--primitive-neutral-200);          /* Default border */
  --stroke-muted: var(--primitive-neutral-100);    /* Subtle divider */
  --stroke-strong: var(--primitive-neutral-300);   /* Emphasized border */
  --stroke-hover: var(--primitive-neutral-300);    /* Border on hover */
  --stroke-focus: var(--primitive-brand-600);      /* Focus ring color */
  --stroke-error: var(--primitive-danger-600);     /* Error state border */

  /* ═══════════════════════════════════════════════════════════════════
     BRAND (Primary Action)
     Usage: bg-brand, text-brand, border-brand, text-on-brand
     ═══════════════════════════════════════════════════════════════════ */
  --brand: var(--primitive-brand-600);             /* Primary action */
  --brand-hover: var(--primitive-brand-700);       /* Hover state */
  --brand-muted: var(--primitive-brand-100);       /* Muted background */
  --brand-fg: var(--primitive-brand-800);          /* Text on muted bg */
  --on-brand: var(--primitive-neutral-0);          /* Text ON brand bg */

  /* ═══════════════════════════════════════════════════════════════════
     SECONDARY (Less Prominent Actions)
     Usage: bg-secondary, text-secondary-fg
     ═══════════════════════════════════════════════════════════════════ */
  --secondary: var(--primitive-neutral-200);
  --secondary-hover: var(--primitive-neutral-300);
  --secondary-fg: var(--primitive-neutral-900);

  /* ═══════════════════════════════════════════════════════════════════
     DANGER (Destructive Actions)
     Usage: bg-danger, text-danger-fg, border-danger
     ═══════════════════════════════════════════════════════════════════ */
  --danger: var(--primitive-danger-600);
  --danger-hover: var(--primitive-danger-700);
  --on-danger: var(--primitive-neutral-0);

  /* Danger feedback (alerts, badges) */
  --danger-bg: var(--primitive-danger-50);
  --danger-bg-emphasis: var(--primitive-danger-100);
  --danger-fg: var(--primitive-danger-600);
  --danger-fg-emphasis: var(--primitive-danger-700);
  --danger-stroke: var(--primitive-danger-200);
  --danger-stroke-emphasis: var(--primitive-danger-600);

  /* ═══════════════════════════════════════════════════════════════════
     SUCCESS (Positive States)
     Usage: bg-success, text-success-fg
     ═══════════════════════════════════════════════════════════════════ */
  --success: var(--primitive-success-600);
  --on-success: var(--primitive-neutral-0);

  /* Success feedback */
  --success-bg: var(--primitive-success-50);
  --success-bg-emphasis: var(--primitive-success-100);
  --success-fg: var(--primitive-success-600);
  --success-fg-emphasis: var(--primitive-success-700);
  --success-stroke: var(--primitive-success-200);

  /* ═══════════════════════════════════════════════════════════════════
     WARNING (Cautionary States)
     Usage: bg-warning, text-warning-fg
     ═══════════════════════════════════════════════════════════════════ */
  --warning: var(--primitive-warning-500);
  --on-warning: var(--primitive-neutral-950);

  /* Warning feedback */
  --warning-bg: var(--primitive-warning-50);
  --warning-bg-emphasis: var(--primitive-warning-100);
  --warning-fg: var(--primitive-warning-700);
  --warning-fg-emphasis: var(--primitive-warning-800);
  --warning-stroke: var(--primitive-warning-200);
  --warning-stroke-emphasis: var(--primitive-warning-300);

  /* ═══════════════════════════════════════════════════════════════════
     INFO (Informational)
     Usage: bg-info, text-info-fg
     ═══════════════════════════════════════════════════════════════════ */
  --info: var(--primitive-info-500);
  --info-muted: var(--primitive-info-400);

  /* ═══════════════════════════════════════════════════════════════════
     BADGE
     Usage: bg-badge (unified mode background)
     ═══════════════════════════════════════════════════════════════════ */
  --badge: var(--primitive-neutral-0);

  /* ═══════════════════════════════════════════════════════════════════
     CHART
     Usage: stroke-chart-grid, text-chart-axis, bg-chart-tooltip
     ═══════════════════════════════════════════════════════════════════ */
  --chart-grid: var(--primitive-neutral-200);
  --chart-axis: var(--primitive-neutral-500);
  --chart-tooltip: var(--primitive-neutral-0);
  --chart-tooltip-stroke: var(--primitive-neutral-200);
  --chart-brand: var(--primitive-brand-500);
  --chart-success: var(--primitive-success-600);
  --chart-danger: var(--primitive-danger-500);
  --chart-accent: var(--primitive-info-500);
  --chart-accent-muted: var(--primitive-info-400);

  /* ═══════════════════════════════════════════════════════════════════
     OVERLAY
     Usage: bg-overlay (modal backdrop)
     ═══════════════════════════════════════════════════════════════════ */
  --overlay: rgba(0, 0, 0, 0.5);

  /* ═══════════════════════════════════════════════════════════════════
     SHADOWS
     Usage: shadow-sm, shadow-md, shadow-footer
     ═══════════════════════════════════════════════════════════════════ */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-footer: 0 -1px 3px rgba(0, 0, 0, 0.04);
  --shadow-glow: 0 0 15px var(--brand);

  /* ═══════════════════════════════════════════════════════════════════
     FOCUS
     Usage: ring-focus (focus ring color)
     ═══════════════════════════════════════════════════════════════════ */
  --focus: var(--primitive-brand-600);
  --focus-offset: var(--panel);

  /* ═══════════════════════════════════════════════════════════════════
     TOAST
     Special: Dark theme always (inverted from page theme)
     ═══════════════════════════════════════════════════════════════════ */
  --toast-bg: #333333;
  --toast-fg: #ffffff;
  --toast-fg-muted: #cccccc;
  --toast-close: #e0e0e0;
  --toast-success: #6cd96d;
  --toast-info: #2196f3;
  --toast-warning: #ffc107;
  --toast-danger: #f44336;
}
```

### 5.2 Dark Theme Overrides (github)

```css
[data-theme="github"] {
  /* Primitives change for this theme */
  --primitive-brand-500: #1F6FEB;
  --primitive-neutral-0: #0B0F16;
  --primitive-neutral-50: #0D1117;
  /* ... etc (as in current theme.css) ... */

  /* Semantic overrides */
  --fg: var(--primitive-neutral-900);      /* Inverted: 900 is light in dark mode */
  --fg-muted: var(--primitive-neutral-700);
  --canvas: var(--primitive-neutral-50);
  --panel: var(--primitive-neutral-0);
  --panel-hover: var(--primitive-neutral-100);
  --stroke: var(--primitive-neutral-200);
  --brand: var(--primitive-brand-500);
  --brand-hover: var(--primitive-brand-400);
  --on-brand: var(--primitive-neutral-900);
  --badge: var(--primitive-neutral-200);
  --overlay: rgba(0, 0, 0, 0.8);
}
```

### 5.3 Dark Theme Overrides (noir-studio)

```css
[data-theme="noir-studio"] {
  /* Primitives change for warm dark theme */
  --primitive-brand-500: #da7756;
  --primitive-neutral-0: #0D0D0D;
  /* ... etc ... */

  /* Same semantic override pattern as github */
}
```

---

## 6. Level 3: Tailwind Integration (index.css)

The `@theme` block maps semantic tokens to Tailwind utility classes.

### 6.1 Complete @theme Block

```css
@import 'tailwindcss';

@theme {
  /* Custom text size */
  --text-xxs: 10px;

  /* ═══════════════════════════════════════════════════════════════════
     FOREGROUND
     ═══════════════════════════════════════════════════════════════════ */
  --color-fg: var(--fg);
  --color-fg-muted: var(--fg-muted);
  --color-fg-subtle: var(--fg-subtle);
  --color-fg-faint: var(--fg-faint);
  --color-fg-disabled: var(--fg-disabled);
  --color-fg-inverse: var(--fg-inverse);

  /* ═══════════════════════════════════════════════════════════════════
     CANVAS & PANEL
     ═══════════════════════════════════════════════════════════════════ */
  --color-canvas: var(--canvas);
  --color-panel: var(--panel);
  --color-panel-hover: var(--panel-hover);
  --color-panel-selected: var(--panel-selected);
  --color-panel-raised: var(--panel-raised);

  /* ═══════════════════════════════════════════════════════════════════
     STROKE
     ═══════════════════════════════════════════════════════════════════ */
  --color-stroke: var(--stroke);
  --color-stroke-muted: var(--stroke-muted);
  --color-stroke-strong: var(--stroke-strong);
  --color-stroke-hover: var(--stroke-hover);
  --color-stroke-focus: var(--stroke-focus);
  --color-stroke-error: var(--stroke-error);

  /* ═══════════════════════════════════════════════════════════════════
     BRAND
     ═══════════════════════════════════════════════════════════════════ */
  --color-brand: var(--brand);
  --color-brand-hover: var(--brand-hover);
  --color-brand-muted: var(--brand-muted);
  --color-brand-fg: var(--brand-fg);
  --color-on-brand: var(--on-brand);

  /* ═══════════════════════════════════════════════════════════════════
     SECONDARY
     ═══════════════════════════════════════════════════════════════════ */
  --color-secondary: var(--secondary);
  --color-secondary-hover: var(--secondary-hover);
  --color-secondary-fg: var(--secondary-fg);

  /* ═══════════════════════════════════════════════════════════════════
     DANGER
     ═══════════════════════════════════════════════════════════════════ */
  --color-danger: var(--danger);
  --color-danger-hover: var(--danger-hover);
  --color-on-danger: var(--on-danger);
  --color-danger-bg: var(--danger-bg);
  --color-danger-bg-emphasis: var(--danger-bg-emphasis);
  --color-danger-fg: var(--danger-fg);
  --color-danger-fg-emphasis: var(--danger-fg-emphasis);
  --color-danger-stroke: var(--danger-stroke);
  --color-danger-stroke-emphasis: var(--danger-stroke-emphasis);

  /* ═══════════════════════════════════════════════════════════════════
     SUCCESS
     ═══════════════════════════════════════════════════════════════════ */
  --color-success: var(--success);
  --color-on-success: var(--on-success);
  --color-success-bg: var(--success-bg);
  --color-success-bg-emphasis: var(--success-bg-emphasis);
  --color-success-fg: var(--success-fg);
  --color-success-fg-emphasis: var(--success-fg-emphasis);
  --color-success-stroke: var(--success-stroke);

  /* ═══════════════════════════════════════════════════════════════════
     WARNING
     ═══════════════════════════════════════════════════════════════════ */
  --color-warning: var(--warning);
  --color-on-warning: var(--on-warning);
  --color-warning-bg: var(--warning-bg);
  --color-warning-bg-emphasis: var(--warning-bg-emphasis);
  --color-warning-fg: var(--warning-fg);
  --color-warning-fg-emphasis: var(--warning-fg-emphasis);
  --color-warning-stroke: var(--warning-stroke);
  --color-warning-stroke-emphasis: var(--warning-stroke-emphasis);

  /* ═══════════════════════════════════════════════════════════════════
     INFO
     ═══════════════════════════════════════════════════════════════════ */
  --color-info: var(--info);
  --color-info-muted: var(--info-muted);

  /* ═══════════════════════════════════════════════════════════════════
     BADGE
     ═══════════════════════════════════════════════════════════════════ */
  --color-badge: var(--badge);

  /* ═══════════════════════════════════════════════════════════════════
     CHART
     ═══════════════════════════════════════════════════════════════════ */
  --color-chart-grid: var(--chart-grid);
  --color-chart-axis: var(--chart-axis);
  --color-chart-tooltip: var(--chart-tooltip);
  --color-chart-tooltip-stroke: var(--chart-tooltip-stroke);
  --color-chart-brand: var(--chart-brand);
  --color-chart-success: var(--chart-success);
  --color-chart-danger: var(--chart-danger);
  --color-chart-accent: var(--chart-accent);
  --color-chart-accent-muted: var(--chart-accent-muted);

  /* ═══════════════════════════════════════════════════════════════════
     NEUTRALS (for direct use when semantic doesn't fit)
     ═══════════════════════════════════════════════════════════════════ */
  --color-neutral-0: var(--primitive-neutral-0);
  --color-neutral-50: var(--primitive-neutral-50);
  --color-neutral-100: var(--primitive-neutral-100);
  --color-neutral-200: var(--primitive-neutral-200);
  --color-neutral-300: var(--primitive-neutral-300);
  --color-neutral-400: var(--primitive-neutral-400);
  --color-neutral-500: var(--primitive-neutral-500);
  --color-neutral-600: var(--primitive-neutral-600);
  --color-neutral-700: var(--primitive-neutral-700);
  --color-neutral-800: var(--primitive-neutral-800);
  --color-neutral-900: var(--primitive-neutral-900);
  --color-neutral-950: var(--primitive-neutral-950);

  /* ═══════════════════════════════════════════════════════════════════
     OVERLAY
     ═══════════════════════════════════════════════════════════════════ */
  --color-overlay: var(--overlay);

  /* ═══════════════════════════════════════════════════════════════════
     SHADOWS
     ═══════════════════════════════════════════════════════════════════ */
  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-footer: var(--shadow-footer);

  /* ═══════════════════════════════════════════════════════════════════
     FOCUS
     ═══════════════════════════════════════════════════════════════════ */
  --color-focus: var(--focus);

  /* ═══════════════════════════════════════════════════════════════════
     TOAST
     ═══════════════════════════════════════════════════════════════════ */
  --color-toast-bg: var(--toast-bg);
  --color-toast-fg: var(--toast-fg);
  --color-toast-fg-muted: var(--toast-fg-muted);
  --color-toast-close: var(--toast-close);
  --color-toast-success: var(--toast-success);
  --color-toast-info: var(--toast-info);
  --color-toast-warning: var(--toast-warning);
  --color-toast-danger: var(--toast-danger);

  /* ═══════════════════════════════════════════════════════════════════
     AUTH (Isolated module - different visual language)
     ═══════════════════════════════════════════════════════════════════ */
  --color-auth-canvas: var(--auth-canvas);
  --color-auth-panel: var(--auth-panel);
  --color-auth-panel-hover: var(--auth-panel-hover);
  --color-auth-input: var(--auth-input-bg);
  --color-auth-input-stroke: var(--auth-input-border);
  --color-auth-input-focus: var(--auth-input-border-focus);
  --color-auth-fg: var(--auth-text-primary);
  --color-auth-fg-muted: var(--auth-text-secondary);
  --color-auth-fg-subtle: var(--auth-text-muted);
  --color-auth-fg-light: var(--auth-text-light);
  --color-auth-accent: var(--auth-accent);
  --color-auth-accent-hover: var(--auth-accent-hover);
  --color-auth-stroke: var(--auth-border);
  --color-auth-stroke-muted: var(--auth-border-light);
  --color-auth-stroke-hover: var(--auth-border-hover);
  --color-auth-error: var(--auth-error-bg);
  --color-auth-error-muted: var(--auth-error-bg-light);
  --color-auth-error-stroke: var(--auth-error-border);
  --color-auth-error-fg: var(--auth-error-text);
  --color-auth-card: var(--auth-feature-card-bg);
  --color-auth-card-hover: var(--auth-feature-card-hover);
  --color-auth-card-stroke: var(--auth-feature-card-border);
}
```

---

## 7. Level 4: Component Token Usage

### 7.1 Tailwind Class Mapping

| Old Class | New Class | Semantic Meaning |
|-----------|-----------|------------------|
| `text-text-primary` | `text-fg` | Primary text |
| `text-text-secondary` | `text-fg-muted` | Secondary text |
| `text-text-tertiary` | `text-fg-subtle` | Tertiary text |
| `text-text-muted` | `text-fg-faint` | Placeholder, hints |
| `text-text-disabled` | `text-fg-disabled` | Disabled state |
| `text-text-inverse` | `text-fg-inverse` | Text on dark |
| `bg-surface-canvas` | `bg-canvas` | Page background |
| `bg-surface-default` | `bg-panel` | Card/container bg |
| `bg-surface-hover` | `bg-panel-hover` | Hover state bg |
| `bg-surface-selected` | `bg-panel-selected` | Selected state |
| `border-border-default` | `border-stroke` | Default border |
| `border-border-subtle` | `border-stroke-muted` | Subtle divider |
| `border-border-strong` | `border-stroke-strong` | Emphasized border |
| `border-border-focus` | `border-stroke-focus` | Focus state |
| `border-border-error` | `border-stroke-error` | Error state |
| `bg-action-primary` | `bg-brand` | Primary button |
| `text-action-primary` | `text-brand` | Primary color text |
| `bg-action-primary-muted-bg` | `bg-brand-muted` | Muted brand bg |
| `text-action-primary-text` | `text-brand-fg` | Text on muted |
| `text-action-primary-on` | `text-on-brand` | Text ON brand |
| `bg-action-danger` | `bg-danger` | Danger button |
| `text-action-danger-on` | `text-on-danger` | Text on danger |
| `bg-feedback-success-bg` | `bg-success-bg` | Success alert bg |
| `text-feedback-success-text` | `text-success-fg` | Success text |
| `border-feedback-success-border` | `border-success-stroke` | Success border |
| `bg-badge-bg` | `bg-badge` | Badge background |

### 7.2 Component-Specific Token Usage

#### Button Component

```tsx
// /shared/ui/forms/Button.tsx

const VARIANT_STYLES = {
  primary: 'bg-brand text-on-brand hover:bg-brand-hover focus:ring-brand',
  secondary: 'bg-secondary text-secondary-fg hover:bg-secondary-hover focus:ring-neutral-500',
  danger: 'bg-danger text-on-danger hover:bg-danger-hover focus:ring-danger',
  success: 'bg-success text-on-success hover:opacity-90 focus:ring-success',
  warning: 'bg-warning text-on-warning hover:opacity-90 focus:ring-warning',
  outline: 'border-2 border-stroke-strong bg-transparent text-fg-muted hover:bg-panel-hover focus:ring-neutral-500',
};
```

#### Input Component

```tsx
// /shared/ui/forms/Input.tsx

const inputBase = `
  w-full rounded border border-stroke px-3 py-2 text-xs
  text-fg bg-panel placeholder:text-fg-faint
  transition-colors duration-200
  hover:border-stroke-hover
  focus:outline-none focus:ring-1 focus:ring-brand focus:ring-opacity-20 focus:border-stroke-focus
  disabled:bg-neutral-100 disabled:text-fg-disabled disabled:cursor-not-allowed
`;

const inputError = `
  border-stroke-error focus:border-stroke-error focus:ring-danger focus:ring-opacity-20
`;
```

#### Card Component

```tsx
// /shared/ui/display/Card.tsx

const baseClasses = 'bg-panel rounded-md border border-stroke duration-200';

const VARIANT_CLASSES = {
  default: '',
  lab: 'shadow-sm hover:bg-panel-hover transition-colors duration-200',
  metric: 'hover:border-brand hover:border-opacity-50 transition-colors duration-200',
};
```

#### Badge Component

```tsx
// /shared/ui/display/Badge.tsx

const UNIFIED_BASE = 'bg-badge border border-stroke shadow-sm';

const UNIFIED_COLORS = {
  neutral: { text: 'text-fg-muted', dot: 'bg-fg-subtle' },
  primary: { text: 'text-brand', dot: 'bg-brand' },
  success: { text: 'text-success-fg-emphasis', dot: 'bg-success-fg-emphasis' },
  warning: { text: 'text-warning-fg-emphasis', dot: 'bg-warning-fg-emphasis' },
  danger: { text: 'text-danger-fg-emphasis', dot: 'bg-danger-fg-emphasis' },
  info: { text: 'text-brand', dot: 'bg-brand' },
};

const TINTED_COLORS = {
  neutral: 'bg-neutral-200 text-fg',
  primary: 'bg-brand text-on-brand',
  success: 'bg-success-bg-emphasis text-success-fg-emphasis',
  warning: 'bg-warning-bg-emphasis text-warning-fg-emphasis',
  danger: 'bg-danger-bg-emphasis text-danger-fg-emphasis',
  info: 'bg-brand-muted text-brand-fg',
};
```

#### Alert Component

```tsx
// /shared/ui/display/Alert.tsx

const VARIANT_STYLES = {
  info: 'bg-brand-muted border-stroke-focus text-brand-fg',
  success: 'bg-success-bg border-success-stroke text-success-fg-emphasis',
  warning: 'bg-warning-bg border-warning-stroke text-warning-fg-emphasis',
  danger: 'bg-danger-bg border-danger-stroke text-danger-fg-emphasis',
};
```

#### Table Components

```tsx
// /shared/ui/Table/TableCore.tsx
const tableWrapper = 'bg-panel rounded-md border border-stroke shadow-sm';

// /shared/ui/Table/TableHeader.tsx
const headerRow = 'bg-canvas px-6 border-b border-stroke';
const headerCell = 'text-xs font-medium text-fg-muted uppercase';

// /shared/ui/Table/TableRow.tsx
const row = 'border-b border-stroke hover:bg-panel-hover transition-colors';
const rowClickable = 'cursor-pointer';

// /shared/ui/Table/TableCell.tsx
const cell = 'text-xs text-fg truncate';
```

#### Modal Component

```tsx
// /shared/ui/overlay/Modal.tsx

const modalBox = 'bg-panel border border-stroke rounded-lg shadow-xl';
const modalHeader = 'px-6 py-4 border-b border-stroke bg-panel';
const modalTitle = 'text-lg font-semibold text-fg';
const modalSubtitle = 'text-sm text-fg-subtle mt-0.5';

// Backdrop
const backdrop = {
  backgroundColor: 'var(--overlay)',
  backdropFilter: 'blur(2px)',
};
```

#### Tabs Component

```tsx
// /shared/ui/layout/Tabs.tsx

// Underline variant
const underlineContainer = 'flex items-center border-b border-stroke relative';
const underlineActive = 'text-brand';
const underlineInactive = 'text-fg-muted hover:text-fg';
const underlineIndicator = 'absolute bottom-0 h-0.5 bg-brand';

// Pills variant
const pillsContainer = 'gap-1 bg-canvas p-1 rounded-lg';
const pillsActive = 'bg-panel text-fg';
const pillsInactive = 'text-fg-muted hover:bg-panel-hover';

// Tab count badge
const countBadgeActive = 'bg-brand-muted text-brand';
const countBadgeInactive = 'bg-neutral-100 text-fg-subtle';
```

#### Sidebar Components

```tsx
// /shared/layout/Sidebar/index.tsx
const sidebarContainer = 'bg-panel border-r border-stroke';

// /shared/layout/Sidebar/SidebarHeader.tsx
const logoIcon = 'text-brand';
const title = 'text-fg font-bold';
const version = 'text-xs text-fg-subtle';

// /shared/layout/Sidebar/SidebarNav.tsx
const navItemActive = 'bg-brand-muted text-brand';
const navItemInactive = 'text-fg-muted hover:bg-panel-hover hover:text-fg';
const navItemDisabled = 'text-fg-disabled cursor-not-allowed';

// /shared/layout/Sidebar/SidebarProfile.tsx
const profileMenu = 'bg-panel border border-stroke rounded shadow-lg';
const profileName = 'text-sm font-medium text-fg';
const profileRole = 'text-xs text-fg-subtle';
```

#### Pagination Component

```tsx
// /shared/ui/navigation/Pagination.tsx

const container = 'flex items-center justify-between px-6 py-3 border-t border-stroke bg-panel';
const pageButtonActive = 'bg-brand text-on-brand';
const pageButtonInactive = 'text-fg-muted hover:bg-panel-hover';
const dots = 'text-fg-disabled';
const infoText = 'text-xs text-fg-muted';
```

---

## 8. Complete Token Reference

### 8.1 Token Hierarchy Diagram

```
PRIMITIVES (Level 1)          SEMANTIC (Level 2)           TAILWIND (Level 3)          COMPONENT (Level 4)
─────────────────────────────────────────────────────────────────────────────────────────────────────────

--primitive-neutral-900  ───► --fg                    ───► --color-fg           ───► text-fg
--primitive-neutral-600  ───► --fg-muted              ───► --color-fg-muted     ───► text-fg-muted
--primitive-neutral-500  ───► --fg-subtle             ───► --color-fg-subtle    ───► text-fg-subtle
--primitive-neutral-400  ───► --fg-faint              ───► --color-fg-faint     ───► text-fg-faint
--primitive-neutral-300  ───► --fg-disabled           ───► --color-fg-disabled  ───► text-fg-disabled
--primitive-neutral-0    ───► --fg-inverse            ───► --color-fg-inverse   ───► text-fg-inverse

--primitive-neutral-50   ───► --canvas                ───► --color-canvas       ───► bg-canvas
--primitive-neutral-0    ───► --panel                 ───► --color-panel        ───► bg-panel
--primitive-neutral-50   ───► --panel-hover           ───► --color-panel-hover  ───► bg-panel-hover
--primitive-brand-100    ───► --panel-selected        ───► --color-panel-selected ► bg-panel-selected

--primitive-neutral-200  ───► --stroke                ───► --color-stroke       ───► border-stroke
--primitive-neutral-100  ───► --stroke-muted          ───► --color-stroke-muted ───► border-stroke-muted
--primitive-neutral-300  ───► --stroke-strong         ───► --color-stroke-strong ──► border-stroke-strong
--primitive-brand-600    ───► --stroke-focus          ───► --color-stroke-focus ───► border-stroke-focus
--primitive-danger-600   ───► --stroke-error          ───► --color-stroke-error ───► border-stroke-error

--primitive-brand-600    ───► --brand                 ───► --color-brand        ───► bg-brand, text-brand
--primitive-brand-700    ───► --brand-hover           ───► --color-brand-hover  ───► hover:bg-brand-hover
--primitive-brand-100    ───► --brand-muted           ───► --color-brand-muted  ───► bg-brand-muted
--primitive-brand-800    ───► --brand-fg              ───► --color-brand-fg     ───► text-brand-fg
--primitive-neutral-0    ───► --on-brand              ───► --color-on-brand     ───► text-on-brand

--primitive-danger-600   ───► --danger                ───► --color-danger       ───► bg-danger
--primitive-danger-700   ───► --danger-hover          ───► --color-danger-hover ───► hover:bg-danger-hover
--primitive-neutral-0    ───► --on-danger             ───► --color-on-danger    ───► text-on-danger
--primitive-danger-50    ───► --danger-bg             ───► --color-danger-bg    ───► bg-danger-bg
--primitive-danger-600   ───► --danger-fg             ───► --color-danger-fg    ───► text-danger-fg
--primitive-danger-200   ───► --danger-stroke         ───► --color-danger-stroke ──► border-danger-stroke

--primitive-success-600  ───► --success               ───► --color-success      ───► bg-success
--primitive-neutral-0    ───► --on-success            ───► --color-on-success   ───► text-on-success
--primitive-success-50   ───► --success-bg            ───► --color-success-bg   ───► bg-success-bg
--primitive-success-600  ───► --success-fg            ───► --color-success-fg   ───► text-success-fg
--primitive-success-200  ───► --success-stroke        ───► --color-success-stroke ► border-success-stroke

--primitive-warning-500  ───► --warning               ───► --color-warning      ───► bg-warning
--primitive-neutral-950  ───► --on-warning            ───► --color-on-warning   ───► text-on-warning
--primitive-warning-50   ───► --warning-bg            ───► --color-warning-bg   ───► bg-warning-bg
--primitive-warning-700  ───► --warning-fg            ───► --color-warning-fg   ───► text-warning-fg
--primitive-warning-200  ───► --warning-stroke        ───► --color-warning-stroke ► border-warning-stroke
```

### 8.2 Quick Reference Card

| What You Need | Token to Use | Example Class |
|---------------|--------------|---------------|
| Main text | `fg` | `text-fg` |
| Secondary text | `fg-muted` | `text-fg-muted` |
| Hint/placeholder | `fg-faint` | `text-fg-faint` |
| Disabled text | `fg-disabled` | `text-fg-disabled` |
| Page background | `canvas` | `bg-canvas` |
| Card background | `panel` | `bg-panel` |
| Row hover | `panel-hover` | `bg-panel-hover` |
| Selected row | `panel-selected` | `bg-panel-selected` |
| Default border | `stroke` | `border-stroke` |
| Light divider | `stroke-muted` | `border-stroke-muted` |
| Emphasized border | `stroke-strong` | `border-stroke-strong` |
| Focus border | `stroke-focus` | `border-stroke-focus` |
| Error border | `stroke-error` | `border-stroke-error` |
| Primary button | `brand` | `bg-brand` |
| Primary hover | `brand-hover` | `hover:bg-brand-hover` |
| Muted brand bg | `brand-muted` | `bg-brand-muted` |
| Text on brand | `on-brand` | `text-on-brand` |
| Danger button | `danger` | `bg-danger` |
| Success button | `success` | `bg-success` |
| Warning button | `warning` | `bg-warning` |
| Success alert bg | `success-bg` | `bg-success-bg` |
| Warning alert bg | `warning-bg` | `bg-warning-bg` |
| Danger alert bg | `danger-bg` | `bg-danger-bg` |
| Success text | `success-fg` | `text-success-fg` |
| Warning text | `warning-fg` | `text-warning-fg` |
| Danger text | `danger-fg` | `text-danger-fg` |

---

## 9. Migration Checklist

### Phase 1: Theme Files

- [ ] **theme.css**: Update to new primitive + semantic token structure
  - [ ] Rename semantic tokens (remove `action-`, `feedback-`, `surface-`, `text-`, `border-` prefixes)
  - [ ] Add new `-emphasis` variants for feedback states
  - [ ] Update dark theme selectors with new tokens

- [ ] **index.css**: Rewrite `@theme` block with new naming
  - [ ] Map all semantic tokens to Tailwind color utilities
  - [ ] Remove redundant mappings

### Phase 2: Shared UI Components

- [ ] `/shared/ui/display/Badge.tsx` - Update color system
- [ ] `/shared/ui/display/Alert.tsx` - Update variant styles
- [ ] `/shared/ui/display/Avatar.tsx` - Update brand colors
- [ ] `/shared/ui/display/Card.tsx` - Update surface/border tokens
- [ ] `/shared/ui/display/EmptyState.tsx` - Update text colors
- [ ] `/shared/ui/display/Icon.tsx` - No changes (inherits color)
- [ ] `/shared/ui/forms/Button.tsx` - Update all variant styles
- [ ] `/shared/ui/forms/IconButton.tsx` - Update variant styles
- [ ] `/shared/ui/forms/Input.tsx` - Update input styles
- [ ] `/shared/ui/forms/DateInput.tsx` - Update styles
- [ ] `/shared/ui/forms/CheckboxList.tsx` - Update selection styles
- [ ] `/shared/ui/forms/TagInput.tsx` - Update container/tag styles
- [ ] `/shared/ui/forms/MultiSelectFilter.tsx` - Update all styles
- [ ] `/shared/ui/forms/inputStyles.ts` - Update shared input classes
- [ ] `/shared/ui/feedback/CircularProgress.tsx` - Update stroke colors
- [ ] `/shared/ui/feedback/LoadingSpinner.tsx` - Update color reference
- [ ] `/shared/ui/feedback/Skeleton.tsx` - Update placeholder color
- [ ] `/shared/ui/navigation/Pagination.tsx` - Update button styles
- [ ] `/shared/ui/navigation/SearchBar.tsx` - Update input styles
- [ ] `/shared/ui/navigation/TableActionMenu.tsx` - Update menu styles
- [ ] `/shared/ui/layout/DetailField.tsx` - Update text colors
- [ ] `/shared/ui/layout/DetailRow.tsx` - Update text colors
- [ ] `/shared/ui/layout/DetailFieldGroup.tsx` - Update border
- [ ] `/shared/ui/layout/DetailsTable.tsx` - Update all styles
- [ ] `/shared/ui/layout/SectionContainer.tsx` - Update surface/border
- [ ] `/shared/ui/layout/TabbedSectionContainer.tsx` - Update styles
- [ ] `/shared/ui/layout/Tabs.tsx` - Update tab styles
- [ ] `/shared/ui/layout/BalancedDetailsLayout.tsx` - No color changes
- [ ] `/shared/ui/overlay/Modal.tsx` - Update surface/border/text
- [ ] `/shared/ui/overlay/Popover.tsx` - Update surface/border
- [ ] `/shared/ui/Table/Table.tsx` - Update wrapper styles
- [ ] `/shared/ui/Table/TableCore.tsx` - Update all table styles
- [ ] `/shared/ui/Table/TableHeader.tsx` - Update header styles
- [ ] `/shared/ui/Table/TableRow.tsx` - Update row styles
- [ ] `/shared/ui/Table/TableCell.tsx` - Update cell styles
- [ ] `/shared/ui/Table/CardGrid.tsx` - No direct color changes
- [ ] `/shared/ui/Table/TableSkeleton.tsx` - Update skeleton styles
- [ ] `/shared/ui/FooterInfo.tsx` - Update text colors

### Phase 3: Shared Layout Components

- [ ] `/shared/layout/AppLayout.tsx` - Update canvas background
- [ ] `/shared/layout/Sidebar/index.tsx` - Update sidebar styles
- [ ] `/shared/layout/Sidebar/SidebarHeader.tsx` - Update brand/text
- [ ] `/shared/layout/Sidebar/SidebarNav.tsx` - Update nav item styles
- [ ] `/shared/layout/Sidebar/SidebarProfile.tsx` - Update profile styles

### Phase 4: Shared Higher-Order Components

- [ ] `/shared/components/sections/SectionCard.tsx` - Update surface/border
- [ ] `/shared/components/sections/SectionGrid.tsx` - No color changes
- [ ] `/shared/components/sections/InfoField.tsx` - Update text colors
- [ ] `/shared/components/data-display/ListView.tsx` - Update styles
- [ ] `/shared/components/data-display/DetailView.tsx` - Update styles
- [ ] `/shared/components/data-display/EntityCard.tsx` - Update styles
- [ ] `/shared/components/feedback/DataLoader.tsx` - No direct colors
- [ ] `/shared/components/feedback/AppToastBar.tsx` - Update toast tokens
- [ ] `/shared/components/feedback/ErrorAlert.tsx` - Update danger tokens
- [ ] `/shared/components/feedback/LoadingState.tsx` - Update colors

### Phase 5: Feature Components

#### Orders
- [ ] All components in `/features/order/components/`
- [ ] All pages in `/features/order/pages/`

#### Patients
- [ ] All components in `/features/patient/components/`
- [ ] All pages in `/features/patient/pages/`

#### Lab
- [ ] All components in `/features/lab/components/`
- [ ] All pages in `/features/lab/pages/`

#### Catalog
- [ ] All pages in `/features/catalog/pages/`

#### Payments
- [ ] All pages in `/features/payment/pages/`

#### Auth
- [ ] `/features/auth/components/LoginFormCard.tsx` - auth-* tokens
- [ ] `/features/auth/components/LoginBrandingPanel.tsx` - auth-* tokens
- [ ] `/features/auth/components/LoginBackground.tsx` - auth-* tokens

### Phase 6: Page Components

- [ ] `/pages/DashboardPage.tsx`
- [ ] `/pages/AdminPage.tsx`
- [ ] `/pages/AppointmentsPage.tsx`

### Phase 7: Utility Files

- [ ] `/shared/ui/display/badge-colors.ts` - Update color mappings
- [ ] `/shared/ui/display/tag-colors.ts` - Update tag color mappings

### Phase 8: Testing

- [ ] Verify studio-light theme renders correctly
- [ ] Verify github theme renders correctly
- [ ] Verify noir-studio theme renders correctly
- [ ] Test all interactive states (hover, focus, active, disabled)
- [ ] Test all feedback states (success, warning, danger, info)
- [ ] Test responsive breakpoints
- [ ] Test dark mode badge appearance (unified)
- [ ] Test light mode badge appearance (tinted)

---

## Appendix A: Component Count Summary

| Category | Count | Files |
|----------|-------|-------|
| Display | 6 | Icon, Badge, Alert, Avatar, Card, EmptyState |
| Forms | 7 | Button, IconButton, Input, DateInput, CheckboxList, TagInput, MultiSelectFilter |
| Feedback | 3 | CircularProgress, LoadingSpinner, Skeleton |
| Navigation | 3 | Pagination, SearchBar, TableActionMenu |
| Layout | 7 | DetailField, DetailRow, DetailFieldGroup, DetailsTable, SectionContainer, TabbedSectionContainer, Tabs, BalancedDetailsLayout |
| Overlay | 3 | Modal, Popover, Portal |
| Table | 7 | Table, TableCore, TableHeader, TableRow, TableCell, CardGrid, TableSkeleton |
| App Layout | 5 | AppLayout, Sidebar, SidebarHeader, SidebarNav, SidebarProfile |
| **Total Shared UI** | **41** | |
| Feature Components | ~75 | Orders, Patients, Lab, Catalog, Payments, Auth |
| Pages | 12 | Dashboard, Admin, etc. |
| **Grand Total** | **~128** | |

---

## Appendix B: Naming Decision Log

| Old Name | New Name | Reason |
|----------|----------|--------|
| `text-primary` | `fg` | Avoids `text-text-primary` → `text-fg` |
| `text-secondary` | `fg-muted` | "muted" is more descriptive than "secondary" |
| `text-tertiary` | `fg-subtle` | "subtle" clearer than numbered hierarchy |
| `text-muted` | `fg-faint` | Distinguishes from `fg-muted` (was confusing) |
| `surface-default` | `panel` | "panel" is specific (component bg), avoids `bg-surface` |
| `surface-canvas` | `canvas` | Keep as-is, clear meaning |
| `border-default` | `stroke` | Avoids `border-border`, "stroke" is clear |
| `action-primary` | `brand` | "brand" is more semantic than "action-primary" |
| `action-primary-on` | `on-brand` | "on-X" pattern for contrast colors |
| `action-secondary-bg` | `secondary` | Simplified, bg implied by `bg-` prefix |
| `feedback-success-bg` | `success-bg` | Removed redundant "feedback-" prefix |
| `feedback-success-text` | `success-fg` | Consistent with fg/stroke naming |
| `feedback-success-text-strong` | `success-fg-emphasis` | "emphasis" clearer than "strong" |

---

*End of Theme Refactoring Plan*
