/**
 * Report preview results — one panel per active test; `layout` selects table vs grid.
 */

import React from 'react';
import { Panel, reportPreviewPanelLoadingContent } from '@/components/surfaces';
import { RecordId } from '@/features/shared';
import {
  ResultValidationNotesSection,
  ResultValidationResultsBody,
} from '@/features/lab/cross';
import type { Gender } from '@/types';
import { text, SPACING } from '@/theme/recipes';
import type { LabReportPayload, ReportPreviewResultsLayout } from '../types';
import { getActiveOrderTests } from '@/utils/presentation';

const PLACEHOLDER_PANEL_COUNT = 2;
interface ReportPreviewResultsProps {
  reportData?: LabReportPayload | null;
  layout?: ReportPreviewResultsLayout;
  loading?: boolean;
}

type ReportTestResult = LabReportPayload['testResults'][number];

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

export const ReportPreviewResults: React.FC<ReportPreviewResultsProps> = ({
  reportData,
  layout = 'table',
  loading = false,
}) => {
  if (loading || reportData == null) {
    return (
      <div className={SPACING.stackRelaxed} aria-busy="true" aria-label="Loading report preview">
        {Array.from({ length: PLACEHOLDER_PANEL_COUNT }).map((_, index) => (
          <Panel
            key={index}
            preset="panel.compact.standard"
            title=""
            loading
            loadingHeaderAside
            loadingContent={reportPreviewPanelLoadingContent(layout)}
          />
        ))}
      </div>
    );
  }

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
              layout={layout}
            />
          </Panel>
        );
      })}
    </div>
  );
};
