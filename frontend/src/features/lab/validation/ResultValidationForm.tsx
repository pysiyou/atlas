/**
 * ResultValidationForm - Form for reviewing and approving test results
 */

import React, { useMemo } from 'react';
import { Textarea } from '@/components/inputs';
import { Panel, type PanelPresetId } from '@/components/surfaces';
import { ResultCriticalValueBanner } from './ResultCriticalValueBanner';
import { statusMapFromFlags, parseResultEntry, isCritical } from '../utils/labResult';
import { ResultsParameterGrid } from '../components/ResultsParameterGrid';
import { ResultContextNotes } from '../components/ResultContextNotes';
import { METRIC_TILE } from '@/theme/recipes';
import { TYPE } from '@/theme/recipes';
import { resolveParameterLabel, useParameterLabelMap } from '@/features/catalog';
import { LAB_CONFIG } from '../constants';
import type { Gender, Patient } from '@/types';

export interface ValidationFormProps {
  results: Record<string, unknown>;
  flags?: string[];
  testCode?: string;
  patient?: Patient | { gender?: Gender; age?: number; dateOfBirth?: string };
  technicianNotes?: string;
  comments: string;
  onCommentsChange: (comments: string) => void;
  onApprove: () => void;
  /** When false, Ctrl+Enter shortcut is disabled (e.g. escalation review modal). */
  enableApproveShortcut?: boolean;
  readOnly?: boolean;
}

export function ResultValidationResultsBody({
  results,
  flags,
  testCode,
  patient,
  technicianNotes,
}: Pick<
  ValidationFormProps,
  'results' | 'flags' | 'testCode' | 'patient' | 'technicianNotes'
>) {
  const hasResults = results && Object.keys(results).length > 0;
  const parameterLabels = useParameterLabelMap(testCode);
  const flagStatusMap = useMemo(() => statusMapFromFlags(flags), [flags]);

  const criticalValues = useMemo(() => {
    if (!hasResults) return [];

    return Object.entries(results)
      .map(([key, rawValue]) => {
        const { resultValue, unit, status } = parseResultEntry(key, rawValue, flagStatusMap);
        if (!isCritical(status)) return null;

        return {
          name: resolveParameterLabel(key, parameterLabels),
          value: resultValue,
          unit,
        };
      })
      .filter((cv): cv is NonNullable<typeof cv> => cv !== null);
  }, [results, flagStatusMap, hasResults, parameterLabels]);

  return (
    <div className="space-y-space-2-5">
      {criticalValues.length > 0 && (
        <ResultCriticalValueBanner criticalParameters={criticalValues} className="py-space-2" />
      )}

      {hasResults && (
        <ResultsParameterGrid
          results={results}
          flags={flags}
          testCode={testCode}
          patient={patient}
          variant="inline"
          layout="validation"
        />
      )}

      <ResultContextNotes flags={flags} testCode={testCode} technicianNotes={technicianNotes} compact />
    </div>
  );
}

export function ResultValidationNotesSection({
  comments,
  onCommentsChange,
  onApprove,
  enableApproveShortcut = true,
  readOnly = false,
}: Pick<
  ValidationFormProps,
  'comments' | 'onCommentsChange' | 'onApprove' | 'enableApproveShortcut' | 'readOnly'
>) {
  if (!readOnly) {
    return (
      <div className="space-y-space-2">
        <Textarea
          label="Validation notes"
          value={comments}
          onChange={e => onCommentsChange(e.target.value)}
          onKeyDown={e => {
            if (enableApproveShortcut && e.ctrlKey && e.key === 'Enter') {
              e.preventDefault();
              onApprove();
            }
          }}
          placeholder="Document review findings or approval rationale…"
          rows={2}
        />
      </div>
    );
  }

  if (!comments?.trim()) return null;

  return (
    <div className="space-y-space-1">
      <p className={METRIC_TILE.notesLabel}>Validation notes</p>
      <p className={`${TYPE.amount} whitespace-pre-wrap leading-snug`}>{comments}</p>
    </div>
  );
}

function validationNotesFooter(props: ValidationFormProps): React.ReactNode | undefined {
  if (!props.readOnly) {
    return <ResultValidationNotesSection {...props} />;
  }
  if (props.comments?.trim()) {
    return <ResultValidationNotesSection {...props} />;
  }
  return undefined;
}

/** Lab panel with scrollable results and pinned validation notes footer. */
export function ResultValidationPanel({
  preset,
  title,
  ...formProps
}: ValidationFormProps & { preset: PanelPresetId; title?: string }) {
  const footer = validationNotesFooter(formProps);

  return (
    <Panel preset={preset} title={title} footer={footer}>
      <ResultValidationResultsBody {...formProps} />
    </Panel>
  );
}

/** Inline scrollable form (results + notes together). Prefer `ResultValidationPanel` in modals. */
export const ResultValidationForm: React.FC<ValidationFormProps> = formProps => {
  return (
    <div
      className={`${LAB_CONFIG.RESULT_VALIDATION_PANEL_MAX_HEIGHT} overflow-y-auto overscroll-contain min-h-0 space-y-space-2-5 pr-space-0.5`}
    >
      <ResultValidationResultsBody {...formProps} />
      <ResultValidationNotesSection {...formProps} />
    </div>
  );
};
