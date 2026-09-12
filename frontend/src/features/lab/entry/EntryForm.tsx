/**
 * EntryForm - Form for entering test results
 */

import React, { useCallback, useState } from 'react';
import { Button, Textarea } from '@/components';
import { cn } from '@/utils';
import type { Test, Patient } from '@/types';
import { ParameterInput } from './EntryFormInputs';
import { getReferenceRangeDisplay, checkCriticalStatus } from './entryForm.utils';
import { RESULT_PANEL, resultTileStatusClass } from '../components/resultDisplayStyles';

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

export const EntryForm: React.FC<EntryFormProps> = ({
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
    <div className={cn(!isModal && 'bg-surface-page rounded-lg p-4 border border-border-subtle')}>
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
              <div className="flex items-baseline justify-between gap-2 min-w-0">
                <label
                  htmlFor={`result-${resultKey}-${param.code}`}
                  className={RESULT_PANEL.label}
                >
                  {param.name}
                </label>
                <span
                  className={cn(
                    RESULT_PANEL.ref,
                    isCritical && 'text-danger-fg font-medium',
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
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-0">
                    <span className="text-xs text-text-disabled select-none">{param.unit}</span>
                  </div>
                )}
              </div>

              {validationErrors[param.code] && (
                <p className="text-xxs text-danger-fg truncate" title={validationErrors[param.code]}>
                  Invalid value
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
        <div className="mt-6 -mx-4 -mb-4 px-4 py-3 bg-surface-page border-t border-border-subtle rounded-b flex items-center justify-between">
          {hasValidationErrors && (
            <span className="text-xxs text-danger-fg">
              Please correct invalid values before submitting
            </span>
          )}
          <Button
            onClick={onSave}
            disabled={!canSubmit}
            variant="submit"
            className="shadow-sm text-xs ml-auto"
          >
            Submit Results
          </Button>
        </div>
      )}
    </div>
  );
};
