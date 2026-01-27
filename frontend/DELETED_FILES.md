# Deleted Files - V2 Architecture Migration

This document lists all files deleted during the V2 architecture migration.

## Patient Feature

### Validation & Form Management
- `src/features/patient/utils/patientValidation.ts` - Replaced by Zod schemas
- `src/features/patient/hooks/usePatientForm.ts` - Replaced by React Hook Form
- `src/features/patient/hooks/usePatientMutation.ts` - Replaced by `usePatientService`
- `src/features/patient/utils/patientPayloadBuilder.ts` - Logic moved to service hook

## Order Feature

### Form & State Management
- `src/features/order/hooks/useOrderController.tsx` - Replaced by `useOrderService`
- `src/features/order/hooks/useOrderForm.ts` - Replaced by React Hook Form
- `src/features/order/hooks/useOrderMutation.ts` - Replaced by `useOrderService`
- `src/features/order/utils/orderPayloadBuilder.ts` - Logic moved to service hook
- `src/features/order/hooks/useOrderPatientSelection.ts` - Logic moved to components/service
- `src/features/order/hooks/useOrderTestSelection.ts` - Logic moved to components/service
- `src/features/order/hooks/useOrderPayment.ts` - Logic moved to service
- `src/features/order/hooks/useDateFilterState.ts` - Replaced by Zustand filter store
- `src/features/order/hooks/useDateFilterNavigation.ts` - Replaced by Zustand filter store

## Lab Feature

### Business Logic
- `src/features/lab/hooks/useRejectionManager.ts` - Replaced by service hook

## Replacement Files

### New Schemas
- `src/shared/schemas/common.schema.ts` - Shared validation patterns
- `src/shared/schemas/error.schema.ts` - API error schemas
- `src/features/patient/schemas/*.ts` - Patient domain schemas
- `src/features/order/schemas/*.ts` - Order domain schemas
- `src/features/lab/schemas/*.ts` - Lab domain schemas

### New Service Hooks
- `src/features/patient/services/usePatientService.ts`
- `src/features/order/services/useOrderService.ts`
- `src/features/lab/services/useLabValidationService.ts`

### New Zustand Stores
- `src/shared/stores/auth.store.ts` - Replaces AuthContext
- `src/shared/stores/modal.store.ts` - Centralized modal state
- `src/shared/stores/filter.store.ts` - Centralized filter state
