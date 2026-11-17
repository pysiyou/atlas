/**
 * ResultEntryForm - Form for entering test results
 */

import { useCallback, useState } from 'react';
import { actionButtonPreset, Button } from '@/components/primitives';
import { Textarea } from '@/components/inputs';
import { cn } from '@/utils';
import { feedbackTitle } from '@/feedback';
import type  { OrderableTest, Patient } from '@/types';
import { LabResultInput } from './LabResultInputs';
import { getReferenceRangeDisplay, checkCriticalStatus } from './resultEntry';
import { text, METRIC_TILE , FG } from '@/theme/recipes';
import { resultTileStatusClass } from '../utils/labResult';
import { labDisabledActionTooltip, labModalFooterDenyMessage } from '../utils/queueDisplay';
import { FIELD_ERROR_CAPTION, RADIUS, SHADOW, TONE } from '@/theme/recipes';

interface EntryFormProps {
  testDef: OrderableTest;
  resultKey: string;
  results: Record<string, string>;
  technicianNotes: string;
  patient?: Patient;
  onResultsChange: (resultKey: string, analyteCode: string, value: string) => void;
  onNotesChange: (resultKey: string, notes: string) => void;
  onSave: () => void;
  isComplete: boolean;
  isModal?: boolean;
  readOnly?: boolean;
  canEnter?: boolean;
  denyMessage?: string | null;
}

export function ResultEntryForm({
  testDef,
  resultKey,
  results,
  technicianNotes,
  patient,
  onResultsChange,
  onNotesChange,
  onSave,
  isComplete,
  isModal = false,
  readOnly = false,
  canEnter = true,
  denyMessage,
}: EntryFormProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});

  const handleValidationChange = useCallback((analyteCode: string, error: string | undefined) => {
    setValidationErrors(prev => ({ ...prev, [analyteCode]: error }));
  }, []);

  const hasValidationErrors = Object.values(validationErrors).some(error => !!error);
  const entryLocked = readOnly || !canEnter;
  const canSubmit = isComplete && !hasValidationErrors && canEnter;
  const footerDenyStatus = labModalFooterDenyMessage({ denyMessage });
  const saveDisabledTitle = labDisabledActionTooltip({ denyMessage });

  if (!testDef?.analytes) return null;

  return (
    <div className={cn(!isModal && cn('bg-surface-page p-panel border border-border-subtle', RADIUS.menu))}>
      <div className={METRIC_TILE.grid}>
        {testDef.analytes.map(analyte => {
          const value = results[analyte.code] ?? '';
          const hasValue = Boolean(value.trim());
          const refRange = getReferenceRangeDisplay(analyte, patient);
          const isCritical = hasValue && checkCriticalStatus(analyte, value);
          const valueType =
            analyte.valueType ||
            (analyte.type === 'numeric' ? 'NUMERIC' : analyte.type === 'select' ? 'SELECT' : 'TEXT');
          const status = isCritical ? 'critical' : 'normal';

          return (
            <div
              key={analyte.code}
              className={cn(
                METRIC_TILE.tile,
                resultTileStatusClass(status, hasValue),
                validationErrors[analyte.code] && 'border-danger-stroke ring-1 ring-danger-stroke/30',
              )}
            >
              <div className="flex items-baseline justify-between gap-space-2 min-w-0">
                <label
                  htmlFor={`result-${resultKey}-${analyte.code}`}
                  className={METRIC_TILE.label}
                >
                  {analyte.name}
                </label>
                <span
                  className={cn(
                    refRange === 'N/A' ? METRIC_TILE.referenceUnavailable : METRIC_TILE.reference,
                    isCritical && refRange !== 'N/A' && cn(TONE.danger.fg, 'font-medium'),
                  )}
                  title={`Reference: ${refRange}`}
                >
                  {refRange}
                </span>
              </div>

              <div className="relative">
                <LabResultInput
                  analyte={analyte}
                  value={value}
                  onChange={newValue => onResultsChange(resultKey, analyte.code, newValue ?? '')}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && canSubmit) {
                      e.preventDefault();
                      onSave();
                    }
                  }}
                  inputId={`result-${resultKey}-${analyte.code}`}
                  validationError={validationErrors[analyte.code]}
                  onValidationChange={error => handleValidationChange(analyte.code, error)}
                  disabled={entryLocked}
                />
                {valueType !== 'TEXT' && analyte.unit && (
                  <div className="absolute inset-y-0 right-0 pr-space-3 flex items-center pointer-events-none z-0">
                    <span className={`${text({ role: 'body', intent: 'muted' })} select-none`}>{analyte.unit}</span>
                  </div>
                )}
              </div>

              {validationErrors[analyte.code] && (
                <p className={`${FIELD_ERROR_CAPTION} truncate`} title={validationErrors[analyte.code]}>
                  {feedbackTitle('lab.entry.fieldInvalid')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className={METRIC_TILE.notesSection}>
        <label htmlFor={`notes-${resultKey}`} className={METRIC_TILE.notesLabel}>
          Technician notes <span className={FG.disabled}>(optional)</span>
        </label>
        <Textarea
          id={`notes-${resultKey}`}
          value={technicianNotes ?? ''}
          onChange={e => onNotesChange(resultKey, e.target.value ?? '')}
          placeholder="Instrument flags, repeat run context, or other analysis notes…"
          rows={isModal ? 2 : 1}
          disabled={entryLocked}
        />
      </div>

      {!isModal && (
        <div className={`mt-space-6 -mx-space-4 -mb-space-4 px-space-4 py-space-3 bg-surface-page border-t border-border-subtle ${RADIUS.bottomSurface} flex items-center justify-between`}>
          {hasValidationErrors && (
            <span className={FIELD_ERROR_CAPTION}>
              {feedbackTitle('lab.entry.fixValidationBeforeSubmit')}
            </span>
          )}
          {!canEnter && !hasValidationErrors && footerDenyStatus && (
            <span className={FIELD_ERROR_CAPTION}>{footerDenyStatus}</span>
          )}
          <Button
            onClick={onSave}
            disabled={!canSubmit}
            title={!canEnter ? saveDisabledTitle : undefined}
            {...actionButtonPreset('submit')}
            size="sm"
            layout="icon-text"
            className={`${SHADOW.subtle} ml-auto`}
          >
            Submit Results
          </Button>
        </div>
      )}
    </div>
  );
}
