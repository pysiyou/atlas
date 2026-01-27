# Before & After: V2 Architecture Migration

## Pattern Comparison

### 1. Validation

**Before (Custom Validation):**
```typescript
// src/features/patient/utils/patientValidation.ts
export const validatePatientForm = (formData: PatientFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!formData.fullName || formData.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }
  
  if (!formData.phone || !/^\+?[1-9]\d{1,14}$/.test(formData.phone)) {
    errors.phone = 'Invalid phone number';
  }
  
  // ... 150+ more lines
  return errors;
};
```

**After (Zod Schemas):**
```typescript
// src/features/patient/schemas/patient.schema.ts
import { z } from 'zod';
import { nameSchema, phoneSchema } from '@/shared/schemas/common.schema';

export const patientSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
  // ...
});

export type Patient = z.infer<typeof patientSchema>;
```

**Benefits:**
- ✅ Runtime + compile-time validation
- ✅ Automatic TypeScript types
- ✅ Reusable validation patterns
- ✅ Better error messages

---

### 2. Form Management

**Before (Custom Hook):**
```typescript
// src/features/patient/hooks/usePatientForm.ts
export const usePatientForm = (initialData?: Patient) => {
  const [formData, setFormData] = useState<PatientFormData>({...});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {...});
    }
  };
  
  const validate = () => {
    const newErrors = validatePatientForm(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  return { formData, errors, updateField, validate };
};
```

**After (React Hook Form + Zod):**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientFormSchema } from '../schemas/patient.schema';

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(patientFormSchema),
});
```

**Benefits:**
- ✅ Less boilerplate
- ✅ Built-in validation
- ✅ Better performance
- ✅ Standard pattern

---

### 3. Business Logic & Mutations

**Before (Custom Mutation Hook):**
```typescript
// src/features/patient/hooks/usePatientMutation.ts
export const usePatientMutation = ({ onSuccess }) => {
  const queryClient = useQueryClient();
  
  const handleCreatePatient = async (formData: PatientFormData) => {
    const payload = buildNewPatientPayload(formData);
    const response = await apiClient.post('/patients', payload);
    queryClient.invalidateQueries(...);
    toast.success('Patient created');
    onSuccess();
  };
  
  return { handleCreatePatient, handleUpdatePatient };
};
```

**After (Service Hook):**
```typescript
// src/features/patient/services/usePatientService.ts
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
      toast.success('Patient created successfully');
    },
  });

  const calculateAge = (dateOfBirth: string): number => {...};
  
  return { create, update, calculateAge };
}
```

**Benefits:**
- ✅ Centralized business logic
- ✅ Automatic validation
- ✅ Built-in loading/error states
- ✅ Consistent pattern

---

### 4. State Management

**Before (Context API):**
```typescript
// src/features/auth/AuthProvider.tsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  
  const login = async (username, password) => {...};
  const logout = () => {...};
  
  return <AuthContext.Provider value={{...}}>{children}</AuthContext.Provider>;
};

// Usage
const { user, login } = useAuth();
```

**After (Zustand Store):**
```typescript
// src/shared/stores/auth.store.ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (username, password) => {...},
      logout: () => {...},
    }),
    { name: 'auth-storage' }
  )
);

// Usage
const { user, login } = useAuthStore();
```

**Benefits:**
- ✅ No provider nesting
- ✅ Built-in persistence
- ✅ Better DevTools
- ✅ Simpler API

---

## Code Reduction

| Aspect | Before | After | Reduction |
|--------|--------|-------|-----------|
| Patient validation | 191 lines | Zod schema (50 lines) | -74% |
| Patient form hook | 187 lines | React Hook Form (built-in) | -100% |
| Patient mutations | 106 lines | Service hook (65 lines) | -39% |
| Auth Provider | 237 lines | Zustand store (150 lines) | -37% |
| **Total** | ~720 lines | ~265 lines | **-63%** |

## Migration Impact

### Files Created
- 15 schema files
- 4 service hook files
- 3 Zustand store files
- 3 documentation files

### Files Deleted
- 14 legacy files removed
- ~35KB of code deleted

### Files Modified
- 15+ import updates
- All query hooks updated
- AppProviders simplified
