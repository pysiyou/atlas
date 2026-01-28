/**
 * useOrderValidation Hook
 * 
 * Provides validation helpers for order data beyond Zod schema validation
 */

import { orderFormSchema } from '../schemas/order.schema';

/**
 * Hook for order-specific validation logic
 * Note: Most validation is handled by Zod schemas, this provides additional business rules
 */
export function useOrderValidation() {
  /**
   * Validate form data structure (useful for manual validation)
   */
  const validateFormData = (data: unknown): { valid: boolean; error?: string } => {
    try {
      orderFormSchema.parse(data);
      return { valid: true };
    } catch (error) {
      if (error instanceof Error) {
        return { valid: false, error: error.message };
      }
      return { valid: false, error: 'Validation failed' };
    }
  };

  /**
   * Validate that at least one test is selected
   */
  const validateTestSelection = (testCodes: string[]): { valid: boolean; error?: string } => {
    if (!testCodes || testCodes.length === 0) {
      return { valid: false, error: 'At least one test is required' };
    }
    return { valid: true };
  };

  /**
   * Validate patient ID is provided
   */
  const validatePatientId = (patientId: number | undefined): { valid: boolean; error?: string } => {
    if (!patientId || patientId <= 0) {
      return { valid: false, error: 'Patient ID is required' };
    }
    return { valid: true };
  };

  return {
    validateFormData,
    validateTestSelection,
    validatePatientId,
  };
}
