import { checkReferenceRangeWithDemographics } from '@/features/lab/utils';
import { toast } from '@/app/AppToastBar';
import type { TestResult, TestWithContext, Test } from '@/types';

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
        toast.error({
          title: `${param.name}: Invalid value. Must be one of: ${param.allowedValues.join(', ')}`,
          subtitle:
            'The value entered is not in the allowed list for this parameter. Choose one of the options shown.',
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

export function findTestInList(
  allTests: TestWithContext[],
  orderId: number | string,
  testCode: string
): TestWithContext | undefined {
  const numericOrderId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
  return allTests.find(t => t.orderId === numericOrderId && t.testCode === testCode);
}
