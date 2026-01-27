# Service Hooks Guide

## What are Service Hooks?

Service hooks are React hooks that encapsulate business logic, API operations, and domain-specific utilities. They follow the pattern:

```typescript
export function use{Feature}Service() {
  // TanStack Query mutations
  const create = useMutation({...});
  const update = useMutation({...});
  
  // Pure business logic functions
  const calculateSomething = (data) => {...};
  
  return { create, update, calculateSomething };
}
```

## Benefits

1. **Centralized Business Logic**: All domain logic in one place
2. **Type Safety**: Zod validation ensures runtime + compile-time safety
3. **Automatic Cache Management**: TanStack Query handles invalidation
4. **Reusable**: Use in any component without prop drilling
5. **Testable**: Easy to test with renderHook

## Service Hook Structure

### Mutations

```typescript
const create = useMutation({
  mutationFn: async (input: unknown) => {
    // 1. Validate input with Zod
    const validated = formSchema.parse(input);
    
    // 2. Call API
    const response = await apiClient.post('/endpoint', validated);
    
    // 3. Validate response
    return entitySchema.parse(response);
  },
  onSuccess: () => {
    // 4. Invalidate cache
    queryClient.invalidateQueries({ queryKey: queryKeys.entity.all });
    
    // 5. Show success message
    toast.success('Success message');
  },
  onError: (error) => {
    toast.error(`Error: ${error.message}`);
  },
});
```

### Business Logic Functions

```typescript
// Pure functions for domain calculations
const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  // ... calculation logic
  return age;
};

const isActive = (entity: Entity): boolean => {
  return new Date(entity.endDate) > new Date();
};
```

## Example: Patient Service

```typescript
// src/features/patient/services/usePatientService.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patientSchema, patientFormSchema, type Patient } from '../schemas/patient.schema';
import { apiClient } from '@/services/api/client';
import { queryKeys } from '@/lib/query/keys';
import toast from 'react-hot-toast';

export function usePatientService() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (input: unknown) => {
      const validated = patientFormSchema.parse(input);
      const response = await apiClient.post<Patient>('/patients', validated);
      return patientSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      toast.success('Patient created successfully');
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: unknown }) => {
      const validated = patientFormSchema.partial().parse(data);
      const response = await apiClient.put<Patient>(`/patients/${id}`, validated);
      return patientSchema.parse(response);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.byId(String(id)) });
      toast.success('Patient updated successfully');
    },
  });

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const isAffiliationActive = (patient: Patient): boolean => {
    if (!patient.affiliation) return false;
    return new Date(patient.affiliation.endDate) > new Date();
  };

  return { create, update, calculateAge, isAffiliationActive };
}
```

## Usage in Components

### With React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientFormSchema } from '../schemas/patient.schema';
import { usePatientService } from '../services/usePatientService';

function PatientForm({ onSuccess }) {
  const { create, update, calculateAge } = usePatientService();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(patientFormSchema),
  });
  
  const onSubmit = async (data) => {
    await create.mutateAsync(data);
    onSuccess?.();
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('fullName')} />
      {errors.fullName && <span>{errors.fullName.message}</span>}
      
      <button type="submit" disabled={create.isPending}>
        {create.isPending ? 'Creating...' : 'Create Patient'}
      </button>
    </form>
  );
}
```

### Business Logic Usage

```typescript
function PatientCard({ patient }) {
  const { calculateAge, isAffiliationActive } = usePatientService();
  
  const age = calculateAge(patient.dateOfBirth);
  const hasActiveAffiliation = isAffiliationActive(patient);
  
  return (
    <div>
      <p>Age: {age}</p>
      {hasActiveAffiliation && <Badge>Active Affiliation</Badge>}
    </div>
  );
}
```

## Best Practices

1. **One service hook per feature**: `usePatientService`, `useOrderService`, etc.
2. **Validate everything**: Use Zod for all inputs and outputs
3. **Pure functions**: Keep business logic functions pure (no side effects)
4. **Automatic cache invalidation**: Always invalidate related caches on success
5. **User feedback**: Always show toast messages for user actions
6. **Error handling**: Handle errors in onError callback
7. **Type safety**: Avoid `any`, use Zod inference

## Anti-Patterns to Avoid

❌ **Don't bypass Zod validation:**
```typescript
// Bad
const response = await apiClient.post('/patients', unvalidatedData);

// Good
const validated = patientFormSchema.parse(unvalidatedData);
const response = await apiClient.post('/patients', validated);
```

❌ **Don't mix business logic in components:**
```typescript
// Bad - in component
const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();

// Good - in service
const { calculateAge } = usePatientService();
const age = calculateAge(patient.dateOfBirth);
```

❌ **Don't forget cache invalidation:**
```typescript
// Bad
onSuccess: () => {
  toast.success('Done');
}

// Good
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.entity.all });
  toast.success('Done');
}
```

## Testing Service Hooks

```typescript
import { renderHook } from '@testing-library/react';
import { usePatientService } from '../usePatientService';

describe('usePatientService', () => {
  it('creates patient with valid data', async () => {
    const { result } = renderHook(() => usePatientService(), { wrapper });
    
    await result.current.create.mutateAsync(validPatientData);
    
    expect(result.current.create.isSuccess).toBe(true);
  });
  
  it('calculates age correctly', () => {
    const { result } = renderHook(() => usePatientService());
    const age = result.current.calculateAge('1990-01-01T00:00:00Z');
    expect(age).toBeGreaterThan(30);
  });
});
```
