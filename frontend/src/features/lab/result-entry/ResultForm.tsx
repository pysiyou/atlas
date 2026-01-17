import React from 'react';
import { Button, Textarea } from '@/shared/ui';
import { AlertTriangle } from 'lucide-react';
import { Icon } from '@/shared/ui/Icon';
import type { Test, TestParameter } from '@/types';
import type { Patient } from '@/types';
import {
  formatReferenceRange,
  isCriticalValue
} from '@/utils/reference-ranges';

interface ResultFormProps {
  testDef: Test;
  resultKey: string;
  results: Record<string, string>;
  technicianNotes: string;
  patient?: Patient;
  onResultsChange: (resultKey: string, paramCode: string, value: string) => void;
  onNotesChange: (resultKey: string, notes: string) => void;
  onSave: () => void;
  isComplete: boolean;
  /** Optional: If true, uses more columns for better space utilization in modal context */
  isModal?: boolean;
}

/**
 * Render input field based on parameter value type
 * 
 * Ensures all input types are fully editable and handle edge cases properly
 */
const renderParameterInput = (
  param: TestParameter,
  value: string,
  onChange: (value: string) => void,
  onKeyDown: (e: React.KeyboardEvent) => void,
  inputId?: string
): React.ReactNode => {
  const valueType = param.valueType || (param.type === 'numeric' ? 'NUMERIC' : param.type === 'select' ? 'SELECT' : 'TEXT');
  
  // Normalize value to ensure it's always a string (never undefined or null)
  const normalizedValue = value ?? '';
  
  // Common input props
  const commonProps = {
    id: inputId,
    value: normalizedValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      onChange(e.target.value);
    },
    onKeyDown,
  };
  
  if (valueType === 'SELECT' && param.allowedValues) {
    return (
      <select
        {...commonProps}
        className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed bg-white cursor-pointer"
      >
        <option value="">-- Select --</option>
        {param.allowedValues.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }
  
  if (valueType === 'TEXT') {
    return (
      <textarea
        {...commonProps}
        className="block w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-gray-300 transition-shadow resize-none"
        placeholder="Enter text result..."
        rows={2}
      />
    );
  }
  
  // NUMERIC type - use text input with decimal inputMode for better control
  // This allows full fillability and removes spinner arrows
  // Using inputMode="decimal" allows decimals, inputMode="numeric" only allows integers
  return (
    <input
      {...commonProps}
      type="text"
      inputMode="decimal"
      className="block w-full pl-3 pr-12 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-gray-300 transition-shadow relative z-10"
      placeholder="--"
      // Allow any numeric input including decimals
      // Validation happens on save, not during input
    />
  );
};

/**
 * Get reference range display for parameter
 */
const getReferenceRangeDisplay = (param: TestParameter, patient?: Patient): string => {
  if (param.catalogReferenceRange) {
    return formatReferenceRange(param.catalogReferenceRange, patient);
  }
  return param.referenceRange || 'N/A';
};

/**
 * Check if current value is critical
 */
const checkCriticalStatus = (param: TestParameter, value: string): boolean => {
  if (param.valueType !== 'NUMERIC' && param.type !== 'numeric') return false;
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;
  return isCriticalValue(numValue, {
    low: param.criticalLow,
    high: param.criticalHigh,
  });
};

export const ResultForm: React.FC<ResultFormProps> = ({
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
  if (!testDef?.parameters) return null;

  // Use more columns in modal context for better space utilization
  const gridCols = isModal 
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
    : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
      <div className={`grid ${gridCols} gap-4`}>
        {testDef.parameters.map(param => {
          // Ensure value is always a string, never undefined or null
          const value = results[param.code] ?? '';
          const refRange = getReferenceRangeDisplay(param, patient);
          const isCritical = checkCriticalStatus(param, value);
          const valueType = param.valueType || (param.type === 'numeric' ? 'NUMERIC' : param.type === 'select' ? 'SELECT' : 'TEXT');
          
          return (
            <div key={param.code} className="group">
              <div className="flex justify-between items-baseline mb-1">
                <label 
                  htmlFor={`result-${resultKey}-${param.code}`}
                  className="text-xs font-medium text-gray-500 cursor-pointer"
                >
                  {param.name}
                </label>
                <div className="flex items-center gap-1">
                  {isCritical && (
                    <AlertTriangle size={12} className="text-red-500" />
                  )}
                  <span className="text-[10px] text-gray-400">
                    Ref: {refRange}
                  </span>
                </div>
              </div>

              <div className="relative">
                {renderParameterInput(
                  param,
                  value,
                  (newValue) => {
                    // Ensure we always pass a string value
                    onResultsChange(resultKey, param.code, newValue ?? '');
                  },
                  (e) => {
                    if (e.key === 'Enter' && isComplete) {
                      e.preventDefault();
                      onSave();
                    }
                  },
                  `result-${resultKey}-${param.code}`
                )}
                {valueType !== 'TEXT' && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-0">
                    <span className="text-xs text-gray-400 select-none">{param.unit || ''}</span>
                  </div>
                )}
                {isCritical && (
                  <div className="absolute -bottom-5 left-0 text-[10px] text-red-600 font-medium">
                    Critical value
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <label 
          htmlFor={`notes-${resultKey}`}
          className="text-xs font-medium text-gray-500 mb-1 block"
        >
          Technician Notes (Optional)
        </label>
        <Textarea
          id={`notes-${resultKey}`}
          value={technicianNotes ?? ''}
          onChange={(e) => onNotesChange(resultKey, e.target.value ?? '')}
          placeholder="Analysis notes..."
          rows={isModal ? 3 : 1}
        />
      </div>

      {/* Only show submit button in card context - modal has its own footer */}
      {!isModal && (
        <div className="mt-6 -mx-4 -mb-4 px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b flex items-center justify-end">
          <Button
            onClick={onSave}
            disabled={!isComplete}
            className="shadow-sm flex items-center gap-2 text-xs"
          >
            <Icon name="notebook" className="w-4 h-4" />
            Submit Results
          </Button>
        </div>
      )}
    </div>
  );
};
