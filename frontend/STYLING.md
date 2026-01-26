# Styling Standards

This document outlines the styling architecture and standards for the Atlas frontend project.

## Architecture Overview

The project uses a **token-based styling system** built on top of Tailwind CSS v4. All styles should use design tokens rather than hardcoded Tailwind classes.

### Token Hierarchy

```
CSS Variables (theme.css)
    ↓
Base Tokens (colors/spacing/typography)
    ↓
Component Tokens (button/input/card)
    ↓
Composition Tokens (section/layout)
    ↓
Helper Functions (getFormSectionClasses)
    ↓
Components
```

## ✅ DO: Use Design Tokens

### Pattern A: Helper Functions (Preferred)

Use helper functions for common patterns:

```typescript
import { getFormSectionClasses } from '@/shared/design-system/tokens/presets';

const section = getFormSectionClasses();
<div className={section.container}>
  <h3 className={section.heading}>Title</h3>
  <div className={section.content}>...</div>
</div>
```

### Pattern B: Direct Token Imports (Acceptable)

Import tokens directly for custom compositions:

```typescript
import { cardBase, padding } from '@/shared/design-system/tokens/components/card';
import { heading } from '@/shared/design-system/tokens/typography';
import { neutralColors } from '@/shared/design-system/tokens/colors';

const container = `${cardBase.base} ${padding.card.lg}`;
const title = `${heading.h3} ${neutralColors.text.primary}`;
```

### Pattern C: Composition Tokens

Use composition tokens for common patterns:

```typescript
import { sectionStyles, layoutPatterns } from '@/shared/design-system/tokens/presets';

<div className={sectionStyles.container.base}>
  <h3 className={sectionStyles.heading.h3}>Title</h3>
</div>

<div className={layoutPatterns.twoColumnGrid}>
  {/* Grid content */}
</div>
```

## ❌ DON'T: Hardcoded Classes

### Avoid Hardcoded Tailwind Classes

**Bad:**
```typescript
<div className="bg-surface rounded p-6">
  <h3 className="text-lg font-semibold text-text-primary mb-4">Title</h3>
</div>
```

**Good:**
```typescript
import { getFormSectionClasses } from '@/shared/design-system/tokens/presets';

const section = getFormSectionClasses();
<div className={section.container}>
  <h3 className={section.heading}>Title</h3>
</div>
```

### Avoid Hardcoded Hex Colors

**Bad:**
```typescript
<div className="bg-[#232938] text-[#d4989d]">
```

**Good:**
```typescript
import { authColors } from '@/shared/design-system/tokens/colors';

<div className={`${authColors.featureCard.background} ${authColors.error.text}`}>
```

### Avoid Bypassing Tokens

**Bad:**
```typescript
<h3 className="text-lg font-semibold text-text-primary">
```

**Good:**
```typescript
import { heading } from '@/shared/design-system/tokens/typography';

<h3 className={heading.h3}>
```

## Available Helper Functions

### `getFormSectionClasses(variant?)`

Returns classes for form sections with container, heading, and content spacing.

```typescript
const section = getFormSectionClasses(); // default variant
const compactSection = getFormSectionClasses('compact');
```

Returns:
- `container`: Card base + padding
- `heading`: H3 heading with proper spacing
- `content`: Vertical spacing for content

### `getInfoFieldClasses()`

Returns classes for icon + label + value display patterns.

```typescript
const field = getInfoFieldClasses();
<div className={field.container}>
  <Icon className={field.icon} />
  <div className={field.label}>Label</div>
  <div className={field.value}>Value</div>
</div>
```

### `getInputClasses(hasError?, hasIcon?, iconPosition?, size?, disabled?)`

Returns complete input classes with proper states.

```typescript
import { getInputClasses } from '@/shared/design-system/tokens/components/input';

<input className={getInputClasses(false, true, 'left', 'md', false)} />
```

## Common Patterns

### Form Section

```typescript
import { getFormSectionClasses } from '@/shared/design-system/tokens/presets';

const section = getFormSectionClasses();
<div className={section.container}>
  <h3 className={section.heading}>Section Title</h3>
  <div className={section.content}>
    {/* Form fields */}
  </div>
</div>
```

### Info Field (Icon + Label + Value)

```typescript
import { getInfoFieldClasses } from '@/shared/design-system/tokens/presets';

const field = getInfoFieldClasses();
<div className={field.container}>
  <Icon name="user" className={field.icon} />
  <div>
    <div className={field.label}>Label</div>
    <div className={field.value}>Value</div>
  </div>
</div>
```

### Two-Column Grid

```typescript
import { layoutPatterns } from '@/shared/design-system/tokens/presets';

<div className={layoutPatterns.twoColumnGrid}>
  {/* Grid items */}
</div>
```

## Migration Guide

When migrating existing code:

1. **Identify hardcoded patterns:**
   - `bg-surface rounded p-6` → Use `getFormSectionClasses()`
   - `text-lg font-semibold` → Use `heading.h3`
   - `p-6`, `p-4` → Use `padding.card.lg`, `padding.card.md`
   - `bg-[#...]` → Use CSS variables via color tokens

2. **Import appropriate tokens:**
   ```typescript
   import { getFormSectionClasses } from '@/shared/design-system/tokens/presets';
   import { heading, padding } from '@/shared/design-system/tokens/typography';
   ```

3. **Replace hardcoded classes:**
   ```typescript
   // Before
   <div className="bg-surface rounded p-6">
   
   // After
   const section = getFormSectionClasses();
   <div className={section.container}>
   ```

## ESLint Rules

The project includes ESLint rules that warn about common hardcoded patterns. These are configured in `eslint.config.js`.

## File Structure

```
src/shared/design-system/
├── tokens/
│   ├── colors.ts              # Color tokens
│   ├── spacing.ts              # Spacing tokens
│   ├── typography.ts           # Typography tokens
│   ├── borders.ts              # Border tokens
│   ├── components/             # Component-specific tokens
│   │   ├── button.ts
│   │   ├── input.ts
│   │   └── card.ts
│   ├── compositions/          # Composition tokens
│   │   ├── section.ts
│   │   └── layout.ts
│   └── presets.ts              # Barrel export
└── helpers/
    └── compositions.ts         # Helper functions
```

## Benefits

- **Consistency:** Impossible to use wrong colors/spacing
- **Maintainability:** Update once, change everywhere
- **Type Safety:** TypeScript autocomplete for all variants
- **Performance:** Zero runtime overhead (compile-time)
- **Developer Experience:** Faster development with reusable presets

## Questions?

If you're unsure which token to use, check:
1. `src/shared/design-system/tokens/presets.ts` for helper functions
2. `src/shared/design-system/tokens/components/` for component tokens
3. `src/shared/ui/` for examples of token usage in shared components
