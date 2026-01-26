# Token Migration Patterns

## Common Token Replacements

### Color Tokens
```typescript
// OLD → NEW
neutralColors.text.primary → 'text-text-primary'
neutralColors.text.secondary → 'text-text-secondary'
neutralColors.text.tertiary → 'text-text-tertiary'
neutralColors.text.muted → 'text-text-muted'
neutralColors.text.disabled → 'text-text-disabled'
neutralColors.border.default → 'border-border'
neutralColors.border.medium → 'border-border-strong'
neutralColors.border.strong → 'border-neutral-400'

brandColors.primary.background → 'bg-brand'
brandColors.primary.text → 'text-brand'
brandColors.primary.border → 'border-brand'

semanticColors.success.background → 'bg-success'
semanticColors.danger.background → 'bg-danger'
semanticColors.warning.background → 'bg-warning'
semanticColors.danger.errorText → 'text-danger'
```

### Sizing Tokens
```typescript
// OLD → NEW
iconSizes.sm → 'w-4 h-4'
iconSizes.md → 'w-5 h-5'
iconSizes.lg → 'w-6 h-6'
filterControlSizing.height → 'h-[34px]'
```

### Interaction Tokens
```typescript
// OLD → NEW
hover.background → 'hover:bg-surface-hover'
hover.opacity → 'hover:opacity-90'
focus.outline → 'focus:outline-none'
focus.ring → 'focus:ring-2 focus:ring-brand/20'
transitions.colors → 'transition-colors duration-200'
transitions.all → 'transition-all duration-200'
```

### Border Tokens
```typescript
// OLD → NEW
radius.sm → 'rounded-sm'
radius.md → 'rounded-md'
radius.lg → 'rounded-lg'
radius.full → 'rounded-full'
border.default → 'border border-border'
border.divider → 'border-b border-border'
```

### Typography Tokens
```typescript
// OLD → NEW
heading.h1 → 'text-3xl font-bold text-text-primary'
heading.h2 → 'text-2xl font-semibold text-text-primary'
heading.h3 → 'text-lg font-semibold text-text-primary'
body.base → 'text-sm text-text-primary'
body.muted → 'text-sm text-text-muted'
fontSize.xs → 'text-xs'
fontSize.sm → 'text-sm'
fontWeight.medium → 'font-medium'
fontWeight.semibold → 'font-semibold'
```

### Component-Specific Tokens
```typescript
// Card
cardBase.base → 'bg-surface rounded-lg border border-border shadow-sm'
padding.card.sm → 'p-4'
padding.card.md → 'p-6'
padding.card.lg → 'p-8'

// Dropdown
dropdown.trigger → 'h-[34px] px-3 bg-surface border border-border-strong rounded-md'
dropdownContent.base → 'bg-surface border border-border rounded-md shadow-lg'
dropdownItem.base → 'px-3 py-2 text-sm hover:bg-surface-hover cursor-pointer'

// Modal
modal.overlay → 'fixed inset-0 bg-black/50'
modal.content → 'bg-surface rounded-lg shadow-xl'
```

### Helper Function Replacements
```typescript
// OLD
import { getFormSectionClasses } from '@/shared/design-system/tokens/presets';
const section = getFormSectionClasses();
<div className={section.container}>

// NEW
<div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
  <h3 className="text-lg font-semibold text-text-primary mb-4">

// OLD
import { getInputClasses } from '@/shared/design-system/tokens/components/input';
<input className={getInputClasses(hasError, hasIcon, 'left', 'md', disabled)} />

// NEW
<input className="w-full rounded border border-border px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20" />
```

## Migration Steps

1. Remove all imports from `@/shared/design-system`
2. Replace token references with direct Tailwind classes using patterns above
3. Inline any helper function calls with direct class strings
4. Test component visually
5. Run linter to catch any remaining issues
