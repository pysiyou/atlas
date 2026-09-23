/** Result entry parameter display and payload formatting. */
/**
 * Entry form helper utilities for parameter display and validation.
 */
import type { TestParameter, Patient, TestResult, TestWithContext, Test } from '@/types';
import { formatReferenceRange, isCriticalValue, checkReferenceRangeWithDemographics } from '../utils';
import { notify } from '@/utils/feedback';

export const getReferenceRangeDisplay = (param: TestParameter, patient?: Patient): string => {
  if (param.catalogReferenceRange) {
    return formatReferenceRange(param.catalogReferenceRange, patient);
  }
  return param.referenceRange || 'N/A';
};

export const checkCriticalStatus = (param: TestParameter, value: string): boolean => {
  if (param.valueType !== 'NUMERIC' && param.type !== 'numeric') return false;
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;
  return isCriticalValue(numValue, { low: param.criticalLow, high: param.criticalHigh });
};

export function formatParameterResults(
  testResults: Record<string, string>,
  testDef: Test,
  testItem: TestWithContext
): Record<string, unknown> | null {
  const formattedResults: Record<string, unknown> = {};

  for (const param of testDef.parameters ?? []) {
    const value = testResults[param.code];
    if (!value) continue;

    let status: TestResult['status'] = 'normal';
    let processedValue: string | number = value;

    if (param.valueType === 'NUMERIC' || param.type === 'numeric') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        processedValue = numValue;
        status = checkReferenceRangeWithDemographics(numValue, param, testItem.patient);
        if (param.criticalLow !== undefined && numValue < param.criticalLow) status = 'critical';
        else if (param.criticalHigh !== undefined && numValue > param.criticalHigh)
          status = 'critical';
      }
    } else if ((param.valueType === 'SELECT' || param.type === 'select') && param.allowedValues) {
      if (!param.allowedValues.includes(value)) {
        notify.toast('lab.entry.selectInvalid', {
          title: `${param.name}: Invalid value. Must be one of: ${param.allowedValues.join(', ')}`,
        });
        return null;
      }
    }

    formattedResults[param.code] = {
      value: processedValue,
      unit: param.unit,
      referenceRange: param.referenceRange,
      status,
    };
  }

  return formattedResults;
}

export function findTestById(
  allTests: TestWithContext[],
  orderTestId: number
): TestWithContext | undefined {
  return allTests.find(t => t.id === orderTestId);
}

