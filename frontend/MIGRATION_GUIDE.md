# Migration Guide: Working with V2 Architecture

## Quick Start

### 1. Using Schemas

Import and use Zod schemas for validation and type inference:

```typescript
import { patientFormSchema, type PatientFormInput } from '@/features/patient/schemas';

// Validate data
const result = patientFormSchema.safeParse(formData);
if (!result.success) {
  console.error(result.error);
  return;
}

// Type-safe data
const validatedData: PatientFormInput = result.data;
```

### 2. Using Service Hooks

Replace old hooks with service hooks:

```typescript
// OLD: import { usePatientMutation } from '../hooks/usePatientMutation';
// NEW:
import { usePatientService } from '@/features/patient/services/usePatientService';

function MyComponent() {
  const { create, update, calculateAge } = usePatientService();
  
  // Create patient
  const handleCreate = async (data) => {
    await create.mutateAsync(data);
  };
  
  // Business logic
  const age = calculateAge(patient.dateOfBirth);
}
```

### 3. Using Zustand Stores

Replace Context API with Zustand stores:

```typescript
// OLD: import { useAuth } from '@/features/auth/useAuth';
// NEW:
import { useAuthStore } from '@/shared/stores/auth.store';

function MyComponent() {
  // Get entire state
  const { user, isAuthenticated, login, logout } = useAuthStore();
  
  // Or select specific values (optimized)
  const user = useAuthStore(state => state.user);
  const login = useAuthStore(state => state.login);
}
```

## Migration Patterns

### Form Components

**Old Pattern:**
```typescript
const { formData, errors, updateField, validate } = usePatientForm();

<Input
  value={formData.fullName}
  onChange={(e) => updateField('fullName', e.target.value)}
  error={errors.fullName}
/>
```

**New Pattern:**
```typescript
const { register, formState: { errors } } = useForm({
  resolver: zodResolver(patientFormSchema),
});

<input {...register('fullName')} />
{errors.fullName && <span>{errors.fullName.message}</span>}
```

### API Calls

**Old Pattern:**
```typescript
const payload = buildNewPatientPayload(formData);
const response = await apiClient.post('/patients', payload);
queryClient.invalidateQueries([...]);
```

**New Pattern:**
```typescript
const { create } = usePatientService();
await create.mutateAsync(formData); // Validation, API call, cache invalidation all handled
```

### Business Logic

**Old Pattern:**
```typescript
// In component
const isActive = affiliation && new Date(affiliation.endDate) > new Date();
```

**New Pattern:**
```typescript
// In service
const { isAffiliationActive } = usePatientService();
const isActive = isAffiliationActive(patient);
```

## Common Issues

### Issue: "Cannot find module 'usePatientForm'"

**Solution:** Use React Hook Form instead:
```typescript
// Remove
import { usePatientForm } from '../hooks/usePatientForm';

// Add
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientFormSchema } from '../schemas/patient.schema';
```

### Issue: "Cannot find module 'useAuth'"

**Solution:** Use Zustand store:
```typescript
// Remove
import { useAuth } from '@/features/auth/useAuth';

// Add
import { useAuthStore } from '@/shared/stores/auth.store';

// Update usage
// OLD: const { currentUser } = useAuth();
// NEW: const { user: currentUser } = useAuthStore();
```

### Issue: "Cannot find module 'patientValidation'"

**Solution:** Use Zod schemas:
```typescript
// Remove
import { validatePatientForm } from '../utils/patientValidation';

// Add
import { patientFormSchema } from '../schemas/patient.schema';

// Validation happens automatically in React Hook Form with zodResolver
```

## Available Service Hooks

- `usePatientService()` - Patient CRUD and business logic
- `useOrderService()` - Order CRUD and calculations
- `usePaymentService()` - Payment processing
- `useLabValidationService()` - Lab result validation

## Available Zustand Stores

- `useAuthStore()` - Authentication and user state
- `useModalStore()` - Modal open/close state
- `useFilterStore()` - Persistent filter state

## Schema Locations

- Shared: `src/shared/schemas/common.schema.ts`
- Patient: `src/features/patient/schemas/`
- Order: `src/features/order/schemas/`
- Lab: `src/features/lab/schemas/`
- Payment: `src/features/payment/schemas/`
