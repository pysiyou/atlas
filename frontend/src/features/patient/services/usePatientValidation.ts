/**
 * usePatientValidation Hook
 * 
 * Provides validation helpers for patient data beyond Zod schema validation
 */

import { patientFormSchema } from '../schemas/patient.schema';

/**
 * Hook for patient-specific validation logic
 * Note: Most validation is handled by Zod schemas, this provides additional business rules
 */
export function usePatientValidation() {
  /**
   * Validate age is within reasonable bounds
   */
  const validateAge = (dateOfBirth: string): { valid: boolean; error?: string } => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    
    if (isNaN(birth.getTime())) {
      return { valid: false, error: 'Invalid date of birth' };
    }
    
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) 
      ? age - 1 
      : age;
    
    if (adjustedAge < 0) {
      return { valid: false, error: 'Date of birth cannot be in the future' };
    }
    
    if (adjustedAge > 150) {
      return { valid: false, error: 'Age exceeds maximum reasonable value' };
    }
    
    return { valid: true };
  };

  /**
   * Validate form data structure (useful for manual validation)
   */
  const validateFormData = (data: unknown): { valid: boolean; error?: string } => {
    try {
      patientFormSchema.parse(data);
      return { valid: true };
    } catch (error) {
      if (error instanceof Error) {
        return { valid: false, error: error.message };
      }
      return { valid: false, error: 'Validation failed' };
    }
  };

  return {
    validateAge,
    validateFormData,
  };
}
