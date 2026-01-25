# Icon Usage Guidelines

This document provides guidelines for consistent icon usage across the Atlas frontend application. Icons are centralized through icon mappings and helper functions to ensure consistency.

## Overview

Icons in this application are managed through:
- **Icon Mappings** (`src/utils/icon-mappings.ts`): Centralized definitions of which icons to use for different data types
- **Icon Helpers** (`src/utils/icon-helpers.ts`): Utility functions to retrieve icons by type
- **Icon Component** (`src/shared/ui/Icon.tsx`): React component for rendering icons

## Icon Mappings

### Priority Icons

**All priority levels use the same icon** regardless of value (routine, urgent, stat):
- **Icon**: `danger-square`

**Usage:**
```tsx
import { getPriorityIcon } from '@/utils/icon-helpers';
<Icon name={getPriorityIcon()} />
// or
<Icon name={getPriorityIcon('urgent')} /> // value is ignored, same icon returned
```

### Status Icons

**All status values use the same icon** regardless of the specific status:

#### Order Status
- **Icon**: `clock` (same for all: ordered, in-progress, completed, cancelled)

#### Sample Status
- **Icon**: `clock` (same for all: pending, collected, received, accessioned, in-progress, completed, stored, disposed, rejected)

#### Test Status
- **Icon**: `clock` (same for all: pending, sample-collected, in-progress, resulted, validated, rejected, superseded, removed)

**Usage:**
```tsx
import { getOrderStatusIcon, getSampleStatusIcon, getTestStatusIcon } from '@/utils/icon-helpers';
<Icon name={getOrderStatusIcon()} />
<Icon name={getSampleStatusIcon('collected')} /> // value is ignored, same icon returned
<Icon name={getTestStatusIcon('validated')} /> // value is ignored, same icon returned
```

### Sample Type Icons

**All sample types use the same icon** regardless of value:
- **Icon**: `lab-tube` (same for all: blood, urine, stool, swab, tissue, csf, sputum, plasma, serum, other)

**Usage:**
```tsx
import { getSampleTypeIcon } from '@/utils/icon-helpers';
<Icon name={getSampleTypeIcon()} />
// or
<Icon name={getSampleTypeIcon('blood')} /> // value is ignored, same icon returned
```

### Demographic Icons

- **age**: `user-hands`
- **gender**: `user-hands`
- **dateOfBirth / birthday**: `calendar`

**Usage:**
```tsx
import { getDemographicIcon } from '@/utils/icon-helpers';
<Icon name={getDemographicIcon('age')} />
```

### Data Field Icons

Common data fields use these icons:

- **orderId / patientId / sampleId / testId**: `hashtag`
- **priority**: `danger-square`
- **status**: `clock`
- **date / orderDate**: `calendar`
- **phone**: `phone`
- **email**: `mail`
- **address**: `map`
- **height**: `ruler`
- **weight**: `weight`
- **referringPhysician**: `stethoscope`
- **clinicalNotes**: `pen`

**Usage:**
```tsx
import { getDataFieldIcon } from '@/utils/icon-helpers';
<Icon name={getDataFieldIcon('orderId')} />
```

## Best Practices

### 1. Always Use Helper Functions

Instead of hardcoding icon names, use the helper functions. **The helper functions return the same icon for all values in a category**, ensuring consistency:

✅ **Good:**
```tsx
import { getPriorityIcon } from '@/utils/icon-helpers';
<Icon name={getPriorityIcon()} />
// or with value (value is ignored but helps with code clarity)
<Icon name={getPriorityIcon(order.priority)} />
```

❌ **Bad:**
```tsx
<Icon name="danger-square" /> // Hardcoded, breaks consistency
```

### 2. Use Icon Mappings for InfoField/OrderInfoField

When using `InfoField` or `OrderInfoField` components, use helper functions:

✅ **Good:**
```tsx
import { getDataFieldIcon, getPriorityIcon } from '@/utils/icon-helpers';
<OrderInfoField
  icon={getPriorityIcon(order.priority)}
  label="Priority"
  value={<Badge variant={order.priority} />}
/>
```

### 3. Consistent Icon Sizes

Use consistent icon sizes based on context:

- **Small badges**: `w-3 h-3` or `w-3.5 h-3.5`
- **Info fields**: `w-4 h-4`
- **Section headers**: `w-5 h-5`
- **Empty states**: `w-12 h-12`

### 4. Badge Component with Icons

The Badge component now supports optional icons:

```tsx
import { getPriorityIcon } from '@/utils/icon-helpers';
<Badge variant="urgent" icon={getPriorityIcon('urgent')} />
```

## Common Patterns

### Displaying Priority

```tsx
import { getPriorityIcon } from '@/utils/icon-helpers';
import { OrderInfoField } from '@/features/order/components/display/OrderInfoField';

<OrderInfoField
  icon={getPriorityIcon()} // Same icon for all priority values
  label="Priority"
  value={<Badge variant={order.priority} />}
/>
```

### Displaying Status

```tsx
import { getOrderStatusIcon } from '@/utils/icon-helpers';
import { OrderInfoField } from '@/features/order/components/display/OrderInfoField';

<OrderInfoField
  icon={getOrderStatusIcon()} // Same icon for all status values
  label="Status"
  value={<Badge variant={order.overallStatus} />}
/>
```

### Displaying Demographics

```tsx
import { getDemographicIcon } from '@/utils/icon-helpers';
import { InfoField } from '@/shared/components/sections/InfoField';

<InfoField
  icon={getDemographicIcon('age')}
  label="Age & Gender"
  value={`${age} years old • ${gender}`}
/>
```

## Adding New Icons

When adding new icons:

1. Add the icon name to `IconName` type in `src/shared/ui/Icon.tsx`
2. Add the SVG file to `public/icons/`
3. Update icon mappings in `src/utils/icon-mappings.ts` if needed
4. Update this documentation

## Icon Consistency Checklist

When reviewing code, ensure:

- [ ] Priority icons use `getPriorityIcon()` - **same icon for all priority values**
- [ ] Status icons use appropriate status helper (`getOrderStatusIcon()`, `getSampleStatusIcon()`, etc.) - **same icon for all status values**
- [ ] Sample type icons use `getSampleTypeIcon()` - **same icon for all sample type values**
- [ ] Demographic fields use `getDemographicIcon()`
- [ ] Data fields use `getDataFieldIcon()`
- [ ] Icon sizes are consistent for similar contexts
- [ ] No hardcoded icon names for priority/status/sample type
- [ ] **Same icon is used for all values within each category** (priority, status, sample type)

## Examples

### Complete Example: Order Info Section

```tsx
import { getDataFieldIcon, getPriorityIcon, getOrderStatusIcon } from '@/utils/icon-helpers';
import { OrderInfoField } from './OrderInfoField';

export const OrderInfoSection = ({ order }) => (
  <>
    <OrderInfoField
      icon={getDataFieldIcon('orderId')}
      label="Order ID"
      value={displayId.order(order.orderId)}
    />
    <OrderInfoField
      icon={getDataFieldIcon('orderDate')}
      label="Order Date"
      value={formatOrderDate(order.orderDate)}
    />
    <OrderInfoField
      icon={getPriorityIcon()} // Same icon for all priority values
      label="Priority"
      value={<Badge variant={order.priority} />}
    />
    <OrderInfoField
      icon={getOrderStatusIcon()} // Same icon for all status values
      label="Status"
      value={<Badge variant={order.overallStatus} />}
    />
  </>
);
```

## Questions?

If you're unsure which icon to use, check:
1. `src/utils/icon-mappings.ts` for available mappings
2. `src/utils/icon-helpers.ts` for helper functions
3. This documentation for examples

For new icon needs, discuss with the team to ensure consistency before adding new mappings.
