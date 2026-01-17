/**
 * Enhanced Result Validation Utilities
 * Provides comprehensive validation for laboratory test results
 */

import type { TestParameter, TestResult } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  flags: ResultFlag[];
}

export interface ResultFlag {
  type: 'critical' | 'abnormal' | 'delta' | 'panic';
  message: string;
  parameter: string;
  value: number | string;
}

export interface DeltaCheck {
  testCode: string;
  parameterCode: string;
  currentValue: number;
  previousValue: number;
  percentChange: number;
  absoluteChange: number;
  threshold: number;
  requiresReview: boolean;
}

/**
 * Validate numeric result against reference range
 */
export function validateNumericResult(
  value: number,
  parameter: TestParameter,
  gender?: 'male' | 'female'
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const flags: ResultFlag[] = [];

  // Check if value is a valid number
  if (isNaN(value) || !isFinite(value)) {
    errors.push(`Invalid numeric value for ${parameter.name}`);
    return { isValid: false, errors, warnings, flags };
  }

  // Get reference range based on gender
  const refRange = parameter.catalogReferenceRange;
  if (!refRange) {
    warnings.push(`No reference range defined for ${parameter.name}`);
    return { isValid: true, errors, warnings, flags };
  }

  // Determine which range to use
  let low: number | undefined;
  let high: number | undefined;

  if (gender === 'male' && refRange.adult_male) {
    low = refRange.adult_male.low;
    high = refRange.adult_male.high;
  } else if (gender === 'female' && refRange.adult_female) {
    low = refRange.adult_female.low;
    high = refRange.adult_female.high;
  } else if (refRange.adult_general) {
    low = refRange.adult_general.low;
    high = refRange.adult_general.high;
  }

  // Check critical values
  if (parameter.criticalLow !== undefined && value <= parameter.criticalLow) {
    flags.push({
      type: 'critical',
      message: `Critical low value: ${value} ≤ ${parameter.criticalLow}`,
      parameter: parameter.name,
      value,
    });
  }

  if (parameter.criticalHigh !== undefined && value >= parameter.criticalHigh) {
    flags.push({
      type: 'critical',
      message: `Critical high value: ${value} ≥ ${parameter.criticalHigh}`,
      parameter: parameter.name,
      value,
    });
  }

  // Check abnormal values
  if (low !== undefined && value < low) {
    flags.push({
      type: 'abnormal',
      message: `Below normal range: ${value} < ${low}`,
      parameter: parameter.name,
      value,
    });
  }

  if (high !== undefined && value > high) {
    flags.push({
      type: 'abnormal',
      message: `Above normal range: ${value} > ${high}`,
      parameter: parameter.name,
      value,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    flags,
  };
}

/**
 * Perform delta check - compare with previous result
 */
export function performDeltaCheck(
  testCode: string,
  parameterCode: string,
  currentValue: number,
  previousValue: number,
  thresholdPercent: number = 50 // Default 50% change triggers review
): DeltaCheck {
  const absoluteChange = Math.abs(currentValue - previousValue);
  const percentChange = previousValue !== 0 
    ? (absoluteChange / Math.abs(previousValue)) * 100 
    : 100;

  const requiresReview = percentChange > thresholdPercent;

  return {
    testCode,
    parameterCode,
    currentValue,
    previousValue,
    percentChange,
    absoluteChange,
    threshold: thresholdPercent,
    requiresReview,
  };
}

/**
 * Validate text result
 */
export function validateTextResult(
  value: string,
  parameter: TestParameter
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const flags: ResultFlag[] = [];

  if (!value || value.trim().length === 0) {
    errors.push(`${parameter.name} cannot be empty`);
  }

  // Check allowed values for select type
  if (parameter.type === 'select' && parameter.allowedValues) {
    if (!parameter.allowedValues.includes(value)) {
      errors.push(`Invalid value for ${parameter.name}. Allowed values: ${parameter.allowedValues.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    flags,
  };
}

/**
 * Validate all results for a test
 */
export function validateTestResults(
  results: Record<string, TestResult>,
  parameters: TestParameter[],
  gender?: 'male' | 'female',
  previousResults?: Record<string, TestResult>
): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  const allFlags: ResultFlag[] = [];

  parameters.forEach(param => {
    const result = results[param.code];
    
    if (!result) {
      allWarnings.push(`Missing result for ${param.name}`);
      return;
    }

    let validation: ValidationResult;

    if (param.type === 'numeric' && typeof result.value === 'number') {
      validation = validateNumericResult(result.value, param, gender);
      
      // Perform delta check if previous results available
      if (previousResults && previousResults[param.code]) {
        const prevValue = previousResults[param.code].value;
        if (typeof prevValue === 'number') {
          const deltaCheck = performDeltaCheck(
            'TEST', // TODO: Add test code
            param.code,
            result.value,
            prevValue
          );
          
          if (deltaCheck.requiresReview) {
            allFlags.push({
              type: 'delta',
              message: `Significant change from previous: ${deltaCheck.percentChange.toFixed(1)}%`,
              parameter: param.name,
              value: result.value,
            });
          }
        }
      }
    } else if (typeof result.value === 'string') {
      validation = validateTextResult(result.value, param);
    } else {
      validation = {
        isValid: false,
        errors: [`Invalid result type for ${param.name}`],
        warnings: [],
        flags: [],
      };
    }

    allErrors.push(...validation.errors);
    allWarnings.push(...validation.warnings);
    allFlags.push(...validation.flags);
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    flags: allFlags,
  };
}

/**
 * Check if result requires critical notification
 */
export function requiresCriticalNotification(flags: ResultFlag[]): boolean {
  return flags.some(flag => flag.type === 'critical' || flag.type === 'panic');
}

/**
 * Get flag severity level
 */
export function getFlagSeverity(flag: ResultFlag): 'high' | 'medium' | 'low' {
  switch (flag.type) {
    case 'critical':
    case 'panic':
      return 'high';
    case 'delta':
      return 'medium';
    case 'abnormal':
      return 'low';
    default:
      return 'low';
  }
}

/**
 * Format result with appropriate precision
 */
export function formatResultValue(
  value: number | string,
  parameter: TestParameter
): string {
  if (typeof value === 'string') {
    return value;
  }

  const decimals = parameter.decimalsSuggested || parameter.decimalPlaces || 2;
  return value.toFixed(decimals);
}
