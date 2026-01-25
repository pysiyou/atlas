# Design Token System Documentation

## Overview

The design token system provides a centralized source of truth for all styling values across the application. This ensures consistency, maintainability, and enables global theme updates from a single location.

## Token Structure

### Core Tokens

Located in `src/shared/design-system/tokens/`:

- **`colors.ts`** - Color system (semantic, state, brand, neutral, auth)
- **`spacing.ts`** - Spacing system (padding, margin, gap)
- **`typography.ts`** - Typography system (font sizes, weights, line heights, headings, body text)
- **`borders.ts`** - Border system (radius, width, colors)
- **`shadows.ts`** - Shadow system (elevation levels)

### Component Tokens

Located in `src/shared/design-system/tokens/components/`:

- **`button.ts`** - Button component tokens
- **`input.ts`** - Input component tokens
- **`badge.ts`** - Badge component tokens (100+ variants)
- **`alert.ts`** - Alert component tokens
- **`card.ts`** - Card component tokens (desktop & mobile)
- **`modal.ts`** - Modal component tokens
- **`tabs.ts`** - Tabs component tokens
- **`layout.ts`** - Layout component tokens (AppLayout, Sidebar)
- **`table.ts`** - Table component tokens
- **`shared.ts`** - Shared component tokens (LoadingState, ErrorAlert, etc.)

## Usage

### Importing Tokens

```typescript
// Import core tokens
import { semanticColors, brandColors, neutralColors } from '@/shared/design-system/tokens/colors';
import { padding, margin, gap } from '@/shared/design-system/tokens/spacing';
import { heading, body, fontSize } from '@/shared/design-system/tokens/typography';
import { radius, border } from '@/shared/design-system/tokens/borders';
import { shadow } from '@/shared/design-system/tokens/shadows';

// Import component tokens
import { getButtonVariant, buttonBase } from '@/shared/design-system/tokens/components/button';
import { getInputClasses } from '@/shared/design-system/tokens/components/input';
import { getBadgeVariant } from '@/shared/design-system/tokens/components/badge';
import { mobileCard, labCard } from '@/shared/design-system/tokens/components/card';
```

### Using Semantic Colors

**Critical Rule: Same semantic meaning = Same color everywhere**

```typescript
// ✅ CORRECT - Success color is consistent
import { semanticColors } from '@/shared/design-system/tokens/colors';

// Button
className={semanticColors.success.background} // bg-green-600

// Badge
className={semanticColors.success.backgroundLight} // bg-green-100

// Alert
className={semanticColors.success.backgroundLight} // bg-green-100

// ❌ WRONG - Don't use hardcoded colors
className="bg-green-600" // ❌
className="bg-emerald-500" // ❌ (different green)
```

### Using Component Tokens

```typescript
// Button
import { getButtonVariant, getButtonSize } from '@/shared/design-system/tokens/components/button';

const buttonClass = `${getButtonVariant('primary')} ${getButtonSize('md')}`;

// Input
import { getInputClasses } from '@/shared/design-system/tokens/components/input';

const inputClass = getInputClasses(hasError, hasIcon, 'left', 'md', disabled);

// Badge
import { getBadgeVariant } from '@/shared/design-system/tokens/components/badge';

const badgeClass = getBadgeVariant('success');

// Card
import { mobileCard } from '@/shared/design-system/tokens/components/card';

<div className={mobileCard.base}>
  <div className={mobileCard.header.container}>...</div>
</div>
```

## Semantic Color System

### Success (Green)
- **Button/IconButton**: `semanticColors.success.background` (bg-green-600)
- **Badge/Alert**: `semanticColors.success.backgroundLight` (bg-green-100)
- **Text**: `semanticColors.success.textLight` (text-green-800)
- **Icon**: `semanticColors.success.icon` (text-green-600)

### Danger (Red)
- **Button/IconButton**: `semanticColors.danger.background` (bg-red-600)
- **Badge/Alert**: `semanticColors.danger.backgroundLight` (bg-red-100)
- **Text**: `semanticColors.danger.textLight` (text-red-800)
- **Icon**: `semanticColors.danger.icon` (text-red-600)
- **Input Error**: `semanticColors.danger.inputBorder` (border-red-500)

### Warning (Yellow)
- **Button**: `semanticColors.warning.background` (bg-yellow-500)
- **Badge/Alert**: `semanticColors.warning.backgroundLight` (bg-yellow-100)
- **Text**: `semanticColors.warning.textLight` (text-yellow-800)
- **Icon/Values**: `semanticColors.warning.valueHigh` (text-yellow-600)

### Info (Sky)
- **Button**: `semanticColors.info.background` (bg-sky-600)
- **Badge/Alert**: `semanticColors.info.backgroundLight` (bg-sky-100)
- **Text**: `semanticColors.info.textLight` (text-sky-800)
- **Icon**: `semanticColors.info.icon` (text-sky-600)

## Component Consistency Rules

### Same Component Type = Same Tokens

**Cards:**
- All desktop lab cards use `labCard.*` tokens
- All mobile cards use `mobileCard.*` tokens
- All entity cards use `entityCard.*` tokens

**Buttons:**
- `Button.tsx` and `IconButton.tsx` use identical tokens for same variants
- Both use `getButtonVariant()` from tokens

**Inputs:**
- All input types (Input, Textarea, Select, DateInput, TagInput, SearchBar) use `getInputClasses()`
- All labels use `labelTokens.base`
- All error messages use `errorMessage.base`

**Badges & Alerts:**
- Both use `semanticColors` for semantic variants
- Success, danger, warning, info colors match exactly

## Migration Guide

### Before (Hardcoded)
```typescript
<div className="bg-green-600 text-white px-4 py-2 rounded">
  Success
</div>
```

### After (Tokens)
```typescript
import { semanticColors } from '@/shared/design-system/tokens/colors';
import { padding, radius } from '@/shared/design-system/tokens';

<div className={`${semanticColors.success.background} ${semanticColors.success.text} ${padding.button.md} ${radius.button}`}>
  Success
</div>
```

### Component Migration Example

**Before:**
```typescript
const Button = ({ variant }) => {
  const styles = {
    primary: 'bg-blue-600 text-white',
    success: 'bg-green-600 text-white',
  };
  return <button className={styles[variant]}>Click</button>;
};
```

**After:**
```typescript
import { getButtonVariant } from '@/shared/design-system/tokens/components/button';

const Button = ({ variant }) => {
  return <button className={getButtonVariant(variant)}>Click</button>;
};
```

## Best Practices

1. **Always use tokens** - Never hardcode color, spacing, or typography values
2. **Use semantic colors** - Prefer `semanticColors.success` over `bg-green-600`
3. **Use component tokens** - Prefer `getButtonVariant()` over manual class strings
4. **Maintain consistency** - Same component type = same tokens
5. **Import from tokens** - Use centralized imports, not scattered constants

## Token Reference

### Colors
- `semanticColors` - Success, danger, warning, info
- `stateColors` - Rejection, disabled, selected
- `brandColors` - Primary, secondary
- `neutralColors` - White, gray scale, text colors
- `authColors` - Authentication theme colors

### Spacing
- `padding` - Card, input, button, section, horizontal, vertical
- `margin` - Bottom, top, left, right
- `gap` - Card, section, default sizes

### Typography
- `fontSize` - xxs, xs, sm, base, lg, xl, 2xl, 3xl
- `fontWeight` - normal, medium, semibold, bold
- `heading` - h1 through h6
- `body` - default, small, metadata, muted, large
- `label` - default, required, uppercase, sm

### Borders
- `radius` - none, sm, md, lg, xl, 2xl, full, input, button, card, modal
- `width` - none, thin, medium, thick
- `color` - default, medium, strong, focus, error, semantic colors
- `border` - Combined utilities (default, input, card, divider, rejection)

### Shadows
- `shadow` - none, sm, md, lg, xl, 2xl, card, modal, popover
- `shadowTransition` - default, fast, slow

## Helper Functions

### Button
- `getButtonVariant(variant)` - Get variant classes
- `getButtonSize(size)` - Get size classes
- `getButtonClasses(variant, size)` - Get complete button classes

### Input
- `getInputClasses(hasError, hasIcon, iconPosition, size, disabled)` - Get complete input classes

### Badge
- `getBadgeVariant(variant)` - Get variant classes
- `getBadgeSize(size)` - Get size classes
- `getBadgeClasses(variant, size)` - Get complete badge classes

### Alert
- `getAlertClasses(variant)` - Get complete alert classes

### Card
- `getCardClasses(type)` - Get card classes by type (lab, mobile, entity)

## Examples

See migrated components for reference:
- `src/shared/ui/Button.tsx`
- `src/shared/ui/Input.tsx`
- `src/shared/ui/Badge.tsx`
- `src/shared/ui/Alert.tsx`
- `src/shared/ui/Modal.tsx`
- `src/shared/ui/Tabs.tsx`
- `src/shared/ui/Card.tsx`
- `src/features/lab/validation/ValidationMobileCard.tsx`
- `src/features/auth/components/LoginFormCard.tsx`
