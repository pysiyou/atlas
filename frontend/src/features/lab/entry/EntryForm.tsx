/**
 * EntryForm - Form for entering test results
 */

import React, { useCallback, useState } from 'react';
import { Button, Textarea, Popover, Icon } from '@/shared/ui';
import { inputTrigger, inputTriggerOpen, inputBase, inputError } from '@/shared/ui/forms/inputStyles';
import { cn } from '@/utils';
import type { Test, TestParameter, Patient } from '@/types';
import { formatReferenceRange, isCriticalValue } from '@/utils';
import { validatePhysiologicValue, getPhysiologicLimit } from '@/utils';
import { ICONS } from '@/utils';

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

/**
 * RadioOption - Individual radio option in the select popover
 */
const RadioOption: React.FC<{
  option: string;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ option, isSelected, onSelect }) => {
  return (
    <label
      className={cn(
        'group flex items-center px-4 py-2.5 cursor-pointer transition-all duration-150',
        'hover:bg-canvas/80',
        isSelected && 'bg-brand-muted'
      )}
    >
      {/* Radio button */}
      <div className="flex-shrink-0 mr-3">
        <input type="radio" checked={isSelected} onChange={onSelect} className="sr-only" />
        {isSelected ? (
          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-brand transition-all duration-150">
            <div className="w-2 h-2 rounded-full bg-panel" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-stroke-strong group-hover:border-stroke-hover transition-all duration-150" />
        )}
      </div>

      {/* Option label */}
      <span
        className={cn(
          'text-sm transition-colors',
          isSelected ? 'text-fg font-medium' : 'text-fg-subtle group-hover:text-fg'
        )}
      >
        {option}
      </span>
    </label>
  );
};

/**
 * SelectParameterInput - Popover-based select input styled like MultiSelectFilter
 */
const SelectParameterInput: React.FC<{
  param: TestParameter;
  value: string;
  onChange: (value: string) => void;
  inputId: string;
}> = ({ param, value, onChange, inputId }) => {
  /** Handle clearing selection */
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
    },
    [onChange]
  );

  return (
    <Popover
      placement="bottom-start"
      showBackdrop={false}
      trigger={({ isOpen }) => (
        <div
          id={inputId}
          className={cn(
            inputTrigger,
            'min-h-[42px] w-full',
            isOpen && inputTriggerOpen
          )}
        >
          {/* Content */}
          <div className="flex-1 text-xs truncate">
            {value ? (
              <span className="text-fg">{value}</span>
            ) : (
              <span className="text-fg-disabled">-- Select --</span>
            )}
          </div>

          {/* Chevron */}
          <Icon
            name={ICONS.actions.chevronDown}
            className={cn(
              'w-4 h-4 text-fg-disabled transition-transform flex-shrink-0',
              isOpen && 'rotate-180'
            )}
          />

          {/* Clear button */}
          {value && (
            <button
              onClick={handleClear}
              className="p-0.5 -mr-1 hover:bg-neutral-100 rounded transition-colors flex items-center justify-center cursor-pointer flex-shrink-0"
            >
              <Icon name={ICONS.actions.closeCircle} className="w-4 h-4 text-fg-disabled hover:text-fg-subtle" />
            </button>
          )}
        </div>
      )}
      className="min-w-[200px]"
    >
      {({ close }) => (
        <div className="flex flex-col py-1">
          {/* Options list */}
          <div className="max-h-[250px] overflow-y-auto">
            {param.allowedValues?.map(option => (
              <RadioOption
                key={option}
                option={option}
                isSelected={value === option}
                onSelect={() => {
                  onChange(option);
                  close();
                }}
              />
            ))}
          </div>
        </div>
      )}
    </Popover>
  );
};

/** Render input based on parameter type */
const ParameterInput: React.FC<{
  param: TestParameter;
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  inputId: string;
  validationError?: string;
  onValidationChange?: (error: string | undefined) => void;
}> = ({ param, value, onChange, onKeyDown, inputId, validationError, onValidationChange }) => {
  const valueType =
    param.valueType ||
    (param.type === 'numeric' ? 'NUMERIC' : param.type === 'select' ? 'SELECT' : 'TEXT');
  const normalizedValue = value ?? '';

  // Get physiologic limits for numeric inputs
  const limit = valueType === 'NUMERIC' ? getPhysiologicLimit(param.code) : undefined;

  /** Validate value on blur */
  const handleBlur = useCallback(() => {
    if (valueType !== 'NUMERIC' || !normalizedValue) {
      onValidationChange?.(undefined);
      return;
    }
    const result = validatePhysiologicValue(param.code, normalizedValue);
    onValidationChange?.(result.error);
  }, [param.code, normalizedValue, valueType, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange(e.target.value);
    // Clear validation error when user starts typing
    if (validationError) {
      onValidationChange?.(undefined);
    }
  };

  const commonProps = {
    id: inputId,
    value: normalizedValue,
    onChange: handleChange,
    onKeyDown,
    onBlur: handleBlur,
  };

  // Use the new popover-based select for SELECT type
  if (valueType === 'SELECT' && param.allowedValues) {
    return (
      <SelectParameterInput
        param={param}
        value={normalizedValue}
        onChange={onChange}
        inputId={inputId}
      />
    );
  }

  if (valueType === 'TEXT') {
    return (
      <input
        {...commonProps}
        type="text"
        className={cn(inputBase, 'block')}
        placeholder="Enter text result..."
      />
    );
  }

  // Numeric input with validation (spinner hidden via appearance classes)
  const hasError = !!validationError;
  const noSpinner =
    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0';
  return (
    <input
      {...commonProps}
      type="number"
      step="any"
      min={limit?.min}
      max={limit?.max}
      inputMode="decimal"
      className={cn(inputBase, 'block pr-12 relative z-10', noSpinner, hasError && inputError)}
      placeholder="--"
    />
  );
};

/** Get reference range display */
const getReferenceRangeDisplay = (param: TestParameter, patient?: Patient): string => {
  if (param.catalogReferenceRange) {
    return formatReferenceRange(param.catalogReferenceRange, patient);
  }
  return param.referenceRange || 'N/A';
};

/** Check if value is critical */
const checkCriticalStatus = (param: TestParameter, value: string): boolean => {
  if (param.valueType !== 'NUMERIC' && param.type !== 'numeric') return false;
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;
  return isCriticalValue(numValue, { low: param.criticalLow, high: param.criticalHigh });
};

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
  // Track validation errors for each parameter
  const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});

  /** Update validation error for a specific parameter */
  const handleValidationChange = useCallback((paramCode: string, error: string | undefined) => {
    setValidationErrors(prev => ({ ...prev, [paramCode]: error }));
  }, []);

  /** Check if form has any validation errors */
  const hasValidationErrors = Object.values(validationErrors).some(error => !!error);

  /** Check if form can be submitted */
  const canSubmit = isComplete && !hasValidationErrors;

  if (!testDef?.parameters) return null;

  return (
    <div className="bg-canvas rounded-lg p-4 border border-stroke-subtle">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testDef.parameters.map(param => {
          const value = results[param.code] ?? '';
          const refRange = getReferenceRangeDisplay(param, patient);
          const isCritical = checkCriticalStatus(param, value);
          const valueType =
            param.valueType ||
            (param.type === 'numeric' ? 'NUMERIC' : param.type === 'select' ? 'SELECT' : 'TEXT');

          return (
            <div key={param.code} className="group">
              <div className="flex justify-between items-baseline mb-1 gap-2">
                <label
                  htmlFor={`result-${resultKey}-${param.code}`}
                  className="text-xxs font-medium text-fg-subtle cursor-pointer truncate min-w-0"
                >
                  {param.name}
                </label>
                <div className="flex items-center gap-1 min-w-0 shrink-0 max-w-[50%]">
                  <span
                    className={cn(
                      'text-xxs truncate',
                      isCritical ? 'text-danger-fg font-medium animate-pulse' : 'text-fg-disabled'
                    )}
                  >
                    Ref: {refRange}
                  </span>
                </div>
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
                  onValidationChange={(error) => handleValidationChange(param.code, error)}
                />
                {valueType !== 'TEXT' && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-0 max-w-[40%]">
                    <span className="text-xs text-fg-disabled select-none truncate">
                      {param.unit || ''}
                    </span>
                  </div>
                )}
                {validationErrors[param.code] && (
                  <div className="absolute -bottom-5 left-0 text-xxs text-danger-fg font-medium truncate max-w-full" title={validationErrors[param.code]}>
                    Invalid value
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Technician Notes */}
      <div className="mt-4">
        <label
          htmlFor={`notes-${resultKey}`}
          className="text-xs font-medium text-fg-subtle mb-1 block"
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

      {/* Submit button (card context only) */}
      {!isModal && (
        <div className="mt-6 -mx-4 -mb-4 px-4 py-3 bg-canvas border-t border-stroke-subtle rounded-b flex items-center justify-between">
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
