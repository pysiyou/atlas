# V2 Architecture Migration Log

## Overview
Complete migration from custom validation patterns to Feature-Based Service Architecture with Zod schemas, service hooks, and Zustand stores.

## Files to be Deleted

### Patient Feature
- `src/features/patient/utils/patientValidation.ts` - Replaced by Zod schemas
- `src/features/patient/hooks/usePatientForm.ts` - Replaced by React Hook Form
- `src/features/patient/hooks/usePatientMutation.ts` - Replaced by `usePatientService`
- `src/features/patient/utils/patientPayloadBuilder.ts` - Logic moved to service

### Order Feature
- `src/features/order/hooks/useOrderController.tsx` - Replaced by `useOrderService`
- `src/features/order/hooks/useOrderForm.ts` - Replaced by React Hook Form
- `src/features/order/hooks/useOrderMutation.ts` - Replaced by `useOrderService`
- `src/features/order/utils/orderPayloadBuilder.ts` - Logic moved to service
- `src/features/order/hooks/useOrderPatientSelection.ts` - Logic moved to components/service
- `src/features/order/hooks/useOrderTestSelection.ts` - Logic moved to components/service
- `src/features/order/hooks/useOrderPayment.ts` - Logic moved to service
- `src/features/order/hooks/useDateFilterState.ts` - Replaced by Zustand filter store
- `src/features/order/hooks/useDateFilterNavigation.ts` - Replaced by Zustand filter store

### Lab Feature
- `src/features/lab/components/labUtils.ts` - Moved to service hooks
- `src/features/lab/hooks/useRejectionManager.ts` - Replaced by service

### Payment Feature
- `src/features/payment/types/types.ts` - Replaced by Zod schemas

### Auth Feature
- `src/features/auth/AuthContext.ts` - Replaced by Zustand `useAuthStore`
- `src/features/auth/AuthProvider.tsx` - Replaced by Zustand `useAuthStore`
- `src/features/auth/hooks/useAuth.ts` - Replaced by Zustand `useAuthStore`

## Patterns Being Replaced

1. **Custom Validation** → Zod schemas
2. **Custom Form Hooks** → React Hook Form + Zod
3. **Context API** → Zustand stores
4. **Payload Builders** → Inline in service mutations
5. **Business Logic in Components** → Service hooks

## Utilities to Preserve (Migrate, Not Delete)

- `src/utils/reference-ranges.ts` - Will be used in lab service
- `src/utils/physiologic-limits.ts` - Will be used in lab service
- Pure formatter functions
- ID generators and helpers
