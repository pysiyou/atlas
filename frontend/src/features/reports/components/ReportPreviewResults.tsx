/**
 * Report preview results — one compact panel per active test (standard header + label/value rows).
 */

import React from 'react';
import { Panel } from '@/components/surfaces';
import { RecordId } from '@/features/shared';
import {
  ResultValidationNotesSection,
  ResultValidationResultsBody,
} from '@/features/lab';
import type { Gender } from '@/types';
import { text, SPACING } from '@/theme/recipes';
import type { LabReportPayload } from '../types';
import { getActiveOrderTests } from '../utils/prepareReportData';

interface ReportPreviewResultsProps {
  reportData: LabReportPayload;
}

type ReportTestResult = LabReportPayload['testResults'][number];

/**
 * Converts report parameter rows into the OrderTest.results record the validation grid expects.
 */
function parametersToResultsRecord(
  parameters: ReportTestResult['parameters']
): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const parameter of parameters) {
    if (!parameter.code) continue;
    record[parameter.code] = {
      value: parameter.value,
      unit: parameter.unit,
      referenceRange: parameter.referenceRange,
      status: parameter.status,
    };
  }
  return record;
}

function reportPatient(
  reportData: LabReportPayload
): { gender?: Gender; age?: number } {
  const gender =
    reportData.patientGender === 'male' || reportData.patientGender === 'female'
      ? reportData.patientGender
      : undefined;
  return { gender, age: reportData.patientAge };
}

export const ReportPreviewResults: React.FC<ReportPreviewResultsProps> = ({ reportData }) => {
  const patient = reportPatient(reportData);
  const orderTests = getActiveOrderTests(reportData.order);

  if (reportData.testResults.length === 0) {
    return <p className={text({ role: 'body', intent: 'muted' })}>No active tests on this order.</p>;
  }

  return (
    <div className={SPACING.stackRelaxed}>
      {reportData.testResults.map((test, index) => {
        const orderTest = orderTests[index];
        const validationNotes = test.validationNotes?.trim();

        return (
          <Panel
            key={`${test.testCode}-${orderTest?.id ?? index}`}
            preset="panel.compact.standard"
            title={test.testName}
            headerEnd={<RecordId emphasis="mutedBlock">{test.testCode}</RecordId>}
            footer={
              validationNotes ? (
                <ResultValidationNotesSection
                  comments={validationNotes}
                  onCommentsChange={() => {}}
                  onApprove={() => {}}
                  readOnly
                />
              ) : undefined
            }
          >
            <ResultValidationResultsBody
              results={parametersToResultsRecord(test.parameters)}
              flags={orderTest?.flags}
              testCode={test.testCode}
              patient={patient}
              technicianNotes={test.technicianNotes}
              resultsLayout="compact"
            />
          </Panel>
        );
      })}
    </div>
  );
};
