/**
 * Report preview results — one panel per active test; `layout` selects table vs grid.
 */

import { Panel } from '@/components/surfaces';
import { RecordId } from '@/features/shared';
import {
  ResultValidationNotesSection,
  ResultValidationResultsBody,
} from '@/features/lab/cross';
import type { Gender } from '@/types';
import { text, SPACING } from '@/theme/recipes';
import type { LabReportPayload, ReportPreviewResultsLayout } from '@/types';
import { getReleasedOrderTests } from '@/utils/presentation';

const PLACEHOLDER_PANEL_COUNT = 2;
interface ReportPreviewResultsProps {
  reportData?: LabReportPayload | null;
  layout?: ReportPreviewResultsLayout;
  loading?: boolean;
}

type ReportTestResult = LabReportPayload['testResults'][number];

function reportResultRowsToRecord(
  resultRows: ReportTestResult['parameters']
): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const row of resultRows) {
    if (!row.code) continue;
    record[row.code] = {
      value: row.value,
      unit: row.unit,
      referenceRange: row.referenceRange,
      status: row.status,
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

export function ReportPreviewResults({
  reportData,
  layout = 'table',
  loading = false,
}: ReportPreviewResultsProps) {
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
          />
        ))}
      </div>
    );
  }

  const patient = reportPatient(reportData);
  const orderTests = getReleasedOrderTests(reportData.order);
  if (reportData.testResults.length === 0) {
    return (
      <p className={text({ role: 'body', intent: 'muted' })}>
        No released tests on this order yet.
      </p>
    );
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
              results={reportResultRowsToRecord(test.parameters)}
              flags={orderTest?.flags}
              testCode={test.testCode}
              patient={patient}
              technicianNotes={test.technicianNotes}
              layout={layout}
              referenceIntervalDisplay="all_catalog_bands"
            />
          </Panel>
        );
      })}
    </div>
  );
}
