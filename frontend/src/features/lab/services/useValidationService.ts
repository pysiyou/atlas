import type { TestParameter } from '../schemas/result.schema';
import { validatePhysiologicValue } from '@/utils';

export function useValidationService() {
  // Validation logic for test result entry
  const validateResultEntry = (parameterCode: string, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const error = validatePhysiologicValue(parameterCode, numValue);
    if (error) return { valid: false, error };

    return { valid: true };
  };

  // Result processing with reference range checking
  const processTestResults = (parameters: TestParameter[]) => {
    return parameters.map(param => {
      const numValue = typeof param.value === 'string' ? parseFloat(param.value) : param.value;
      // Simplified placeholder - full implementation would check reference ranges
      const status = isNaN(numValue) ? 'normal' : 'normal';
      return { ...param, status };
    });
  };

  return {
    validateResultEntry,
    processTestResults,
  };
}
