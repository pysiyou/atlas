/**
 * EntryForm - Form for entering test results
 */

import React, { useCallback, useState } from 'react';
import { Button, Textarea } from '@/components';
import { cn } from '@/utils';
import type { Test, Patient } from '@/types';
import {
  ParameterInput,
} from './EntryFormInputs';
import { getReferenceRangeDisplay, checkCriticalStatus } from './entryFormUtils';

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
}) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});

  const handleValidationChange = useCallback((paramCode: string, error: string | undefined) => {
    setValidationErrors(prev => ({ ...prev, [paramCode]: error }));
  }, []);

  const hasValidationErrors = Object.values(validationErrors).some(error => !!error);
  const canSubmit = isComplete && !hasValidationErrors;

  if (!testDef?.parameters) return null;

  return (
    <div className="bg-surface-page rounded-lg p-4 border border-border-subtle">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-7">
        {testDef.parameters.map(param => {
          const value = results[param.code] ?? '';
          const refRange = getReferenceRangeDisplay(param, patient);
          const isCritical = checkCriticalStatus(param, value);
          const valueType =
            param.valueType ||
            (param.type === 'numeric' ? 'NUMERIC' : param.type === 'select' ? 'SELECT' : 'TEXT');

          return (
            <div key={param.code} className="group min-h-[72px] flex flex-col">
              <div className="flex justify-between items-baseline mb-1 gap-2">
                <label
                  htmlFor={`result-${resultKey}-${param.code}`}
                  className="text-xxs font-normal text-text-tertiary cursor-pointer truncate min-w-0"
                >
                  {param.name}
                </label>
                <div className="flex items-center gap-1 min-w-0 shrink-0 max-w-[50%]">
                  <span
                    className={cn(
                      'text-xxs truncate',
                      isCritical ? 'text-danger-fg font-normal animate-pulse' : 'text-text-disabled'
                    )}
                  >
                    Ref: {refRange}
                  </span>
                </div>
              </div>

              <div className="relative flex-1">
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
                />
                {valueType !== 'TEXT' && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-0 max-w-[40%]">
                    <span className="text-xs text-text-disabled select-none truncate">
                      {param.unit || ''}
                    </span>
                  </div>
                )}
              </div>
              {validationErrors[param.code] && (
                <div
                  className="text-xxs text-danger-fg font-normal truncate max-w-full mt-1"
                  title={validationErrors[param.code]}
                >
                  Invalid value
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <label
          htmlFor={`notes-${resultKey}`}
          className="text-xs font-normal text-text-tertiary mb-1 block"
        >
          Technician Notes (Optional)
        </label>
        <Textarea
          id={`notes-${resultKey}`}
          value={technicianNotes ?? ''}
          onChange={e => onNotesChange(resultKey, e.target.value ?? '')}
          placeholder="Analysis notes..."
          rows={isModal ? 3 : 1}
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
