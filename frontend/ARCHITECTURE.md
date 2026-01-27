# V2 Architecture Documentation

## Overview

The V2 architecture migration replaces custom validation patterns, Context API, and scattered business logic with a Feature-Based Service Architecture using:

- **Zod schemas** as the single source of truth for validation and types
- **Service hooks** for business logic and API operations
- **Zustand stores** for client state management
- **React Hook Form** for form management

## Architecture Patterns

### Zod Schemas

All domain models are defined as Zod schemas in `src/features/{feature}/schemas/`:

```typescript
// Example: src/features/patient/schemas/patient.schema.ts
import { z } from 'zod';
import { nameSchema, phoneSchema } from '@/shared/schemas/common.schema';

export const patientSchema = z.object({
  id: z.number().int().positive(),
  fullName: nameSchema,
  phone: phoneSchema,
  // ...
});

export type Patient = z.infer<typeof patientSchema>;
```

**Benefits:**
- Runtime validation
- Type inference
- Single source of truth
- Reusable validation patterns

### Service Hooks

Business logic and API operations are encapsulated in service hooks:

```typescript
// Example: src/features/patient/services/usePatientService.ts
export function usePatientService() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (input: unknown) => {
      const validated = patientFormSchema.parse(input);
      const response = await apiClient.post('/patients', validated);
      return patientSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
    },
  });

  return { create, update, calculateAge, isAffiliationActive };
}
```

**Benefits:**
- Centralized business logic
- Automatic cache invalidation
- Type-safe mutations
- Reusable across components

### Zustand Stores

Client state is managed with Zustand stores:

```typescript
// Example: src/shared/stores/auth.store.ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email, password) => { /* ... */ },
      logout: () => { /* ... */ },
    }),
    { name: 'auth-storage' }
  )
);
```

**Benefits:**
- No provider nesting
- Simple API
- Built-in persistence
- Better performance

## Directory Structure

```
src/
├── shared/
│   ├── schemas/          # Shared validation patterns
│   │   ├── common.schema.ts
│   │   └── error.schema.ts
│   └── stores/           # Zustand stores
│       ├── auth.store.ts
│       ├── modal.store.ts
│       └── filter.store.ts
│
└── features/
    └── {feature}/
        ├── schemas/      # Feature domain schemas
        ├── services/     # Service hooks
        ├── components/   # UI components
        └── ...
```

## Migration Status

### ✅ Completed

- [x] Shared schemas foundation
- [x] Patient schemas and service hook
- [x] Order schemas and service hook
- [x] Lab schemas and validation service
- [x] Zustand stores (auth, modal, filter)
- [x] Deleted old validation files
- [x] Deleted old form hooks
- [x] Deleted old mutation hooks
- [x] Deleted payload builders

### 🚧 In Progress

- [ ] Complete form migration to React Hook Form
- [ ] Update all components to use Zustand stores
- [ ] Remove Context API providers

## Usage Examples

### Using Service Hooks

```typescript
import { usePatientService } from '@/features/patient/services/usePatientService';

function PatientForm() {
  const { create, update } = usePatientService();
  
  const onSubmit = async (data: PatientFormInput) => {
    await create.mutateAsync(data);
  };
  
  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

### Using Zustand Stores

```typescript
import { useAuthStore } from '@/shared/stores/auth.store';

function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  
  if (!isAuthenticated) return null;
  
  return <div>Welcome, {user.name} <button onClick={logout}>Logout</button></div>;
}
```

### Using Schemas

```typescript
import { patientFormSchema } from '@/features/patient/schemas/patient.schema';
import { zodResolver } from '@hookform/resolvers/zod';

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(patientFormSchema),
});
```

## Next Steps

1. Complete form migration to React Hook Form
2. Replace all `useAuth()` calls with `useAuthStore()`
3. Migrate modal state to `useModalStore`
4. Migrate filter state to `useFilterStore`
5. Remove Context API providers from App.tsx
