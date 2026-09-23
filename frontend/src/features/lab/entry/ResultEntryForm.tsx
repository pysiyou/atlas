/**
 * ResultEntryForm - Form for entering test results
 */

import React, { useCallback, useState } from 'react';
import { actionButtonPreset, Button, Textarea } from '@/components';
import { cn } from '@/utils';
import { feedbackTitle } from '@/utils/feedback/copy';
import type { Test, Patient } from '@/types';
import { ParameterInput } from './ResultParameterInputs';
import { getReferenceRangeDisplay, checkCriticalStatus } from './resultEntry';
import { RESULT_PANEL, resultTileStatusClass } from '../utils/labResult';
import { RADIUS, SHADOW, TONE, TYPE } from '@/components/theme/recipes';

interface EntryFormProps {
  testDef: Test;
  resultKey: string;
  results: Record<string, string>;
  technicianNotes: string;
  patient?: Patient;
  onResultsChange: (resultKey: string, paramCode: string, value: string) => void;
  onNotesChange: (resultKey: string, notes: string) => void;
  onSave: () => void;
  isComplete: boolean;
  isModal?: boolean;
  readOnly?: boolean;
}

export const ResultEntryForm: React.FC<EntryFormProps> = ({
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
}) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});

  const handleValidationChange = useCallback((paramCode: string, error: string | undefined) => {
    setValidationErrors(prev => ({ ...prev, [paramCode]: error }));
  }, []);

  const hasValidationErrors = Object.values(validationErrors).some(error => !!error);
  const canSubmit = isComplete && !hasValidationErrors;

  if (!testDef?.parameters) return null;

  return (
    <div className={cn(!isModal && cn('bg-surface-page p-panel border border-border-subtle', RADIUS.menu))}>
      <div className={RESULT_PANEL.grid}>
        {testDef.parameters.map(param => {
          const value = results[param.code] ?? '';
          const hasValue = Boolean(value.trim());
          const refRange = getReferenceRangeDisplay(param, patient);
          const isCritical = hasValue && checkCriticalStatus(param, value);
          const valueType =
            param.valueType ||
            (param.type === 'numeric' ? 'NUMERIC' : param.type === 'select' ? 'SELECT' : 'TEXT');
          const status = isCritical ? 'critical' : 'normal';

          return (
            <div
              key={param.code}
              className={cn(
                RESULT_PANEL.tile,
                resultTileStatusClass(status, hasValue),
                validationErrors[param.code] && 'border-danger-stroke ring-1 ring-danger-stroke/30',
              )}
            >
              <div className="flex items-baseline justify-between gap-space-2 min-w-0">
                <label
                  htmlFor={`result-${resultKey}-${param.code}`}
                  className={RESULT_PANEL.label}
                >
                  {param.name}
                </label>
                <span
                  className={cn(
                    refRange === 'N/A' ? RESULT_PANEL.referenceUnavailable : RESULT_PANEL.reference,
                    isCritical && refRange !== 'N/A' && cn(TONE.danger.fg, 'font-medium'),
                  )}
                  title={`Reference: ${refRange}`}
                >
                  {refRange}
                </span>
              </div>

              <div className="relative">
                <ParameterInput
                  param={param}
                  value={value}
                  onChange={newValue => onResultsChange(resultKey, param.code, newValue ?? '')}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && canSubmit) {
                      e.preventDefault();
                      onSave();
                    }
                  }}
                  inputId={`result-${resultKey}-${param.code}`}
                  validationError={validationErrors[param.code]}
                  onValidationChange={error => handleValidationChange(param.code, error)}
                  disabled={readOnly}
                />
                {valueType !== 'TEXT' && param.unit && (
                  <div className="absolute inset-y-0 right-0 pr-space-3 flex items-center pointer-events-none z-0">
                    <span className={`${TYPE.meta} select-none`}>{param.unit}</span>
                  </div>
                )}
              </div>

              {validationErrors[param.code] && (
                <p className={`text-xxs ${TONE.danger.fg} truncate`} title={validationErrors[param.code]}>
                  {feedbackTitle('lab.entry.fieldInvalid')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className={RESULT_PANEL.notesSection}>
        <label htmlFor={`notes-${resultKey}`} className={RESULT_PANEL.notesLabel}>
          Technician notes <span className="text-text-disabled">(optional)</span>
        </label>
        <Textarea
          id={`notes-${resultKey}`}
          value={technicianNotes ?? ''}
          onChange={e => onNotesChange(resultKey, e.target.value ?? '')}
          placeholder="Instrument flags, repeat run context, or other analysis notes…"
          rows={isModal ? 2 : 1}
          disabled={readOnly}
        />
      </div>

      {!isModal && (
        <div className={`mt-space-6 -mx-space-4 -mb-space-4 px-space-4 py-space-3 bg-surface-page border-t border-border-subtle ${RADIUS.bottomSurface} flex items-center justify-between`}>
          {hasValidationErrors && (
            <span className={`text-xxs ${TONE.danger.fg}`}>
              {feedbackTitle('lab.entry.fixValidationBeforeSubmit')}
            </span>
          )}
          <Button
            onClick={onSave}
            disabled={!canSubmit}
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
};
