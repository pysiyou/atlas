/**
 * Entry form parameter inputs — radio select, numeric, and text fields.
 */

import React, { useCallback } from 'react';
import { Popover, Icon } from '@/components';
import { inputTrigger, inputTriggerOpen, inputBase, inputError } from '@/components/inputs/inputStyles';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';
import type { TestParameter } from '@/types';
import { validatePhysiologicValue, getPhysiologicLimit } from '@/features/lab/utils';
import { titleCaseWords } from '@/utils/string';

const RadioOption: React.FC<{
  option: string;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ option, isSelected, onSelect }) => (
  <label
    className={cn(
      'group flex items-center px-4 py-2.5 cursor-pointer transition-all duration-150',
      'hover:bg-surface-page/80',
      isSelected && 'bg-brand-muted'
    )}
  >
    <div className="flex-shrink-0 mr-3">
      <input type="radio" checked={isSelected} onChange={onSelect} className="sr-only" />
      <div
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150',
          isSelected
            ? 'bg-brand'
            : 'bg-transparent border-2 border-border-strong group-hover:border-border-hover'
        )}
      >
        {isSelected && <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />}
      </div>
    </div>
    <span
      className={cn(
        'text-sm transition-colors',
        isSelected ? 'text-text-primary font-normal' : 'text-text-tertiary group-hover:text-text-primary'
      )}
    >
      {titleCaseWords(option)}
    </span>
  </label>
);

const SelectParameterInput: React.FC<{
  param: TestParameter;
  value: string;
  onChange: (value: string) => void;
  inputId: string;
}> = ({ param, value, onChange, inputId }) => {
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
        <div id={inputId} className={cn(inputTrigger, 'w-full', isOpen && inputTriggerOpen)}>
          <div className="flex-1 text-xs truncate">
            {value ? (
              <span className="text-text-primary">{titleCaseWords(value)}</span>
            ) : (
              <span className="text-text-disabled">-- Select --</span>
            )}
          </div>
          <Icon
            name={ICONS.actions.chevronDown}
            className={cn(
              'w-4 h-4 text-text-disabled transition-transform flex-shrink-0',
              isOpen && 'rotate-180'
            )}
          />
          {value && (
            <button
              onClick={handleClear}
              className="p-0.5 -mr-1 hover:bg-neutral-100 rounded transition-colors flex items-center justify-center cursor-pointer flex-shrink-0"
            >
              <Icon
                name={ICONS.actions.closeCircle}
                className="w-4 h-4 text-text-disabled hover:text-text-tertiary"
              />
            </button>
          )}
        </div>
      )}
      className="min-w-[200px]"
    >
      {({ close }) => (
        <div className="flex flex-col py-1">
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

export const ParameterInput: React.FC<{
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
  const limit = valueType === 'NUMERIC' ? getPhysiologicLimit(param.code) : undefined;

  const handleBlur = useCallback(() => {
    if (valueType !== 'NUMERIC' || !normalizedValue) {
      onValidationChange?.(undefined);
      return;
    }
    const result = validatePhysiologicValue(param.code, normalizedValue);
    onValidationChange?.(result.error);
  }, [param.code, normalizedValue, valueType, onValidationChange]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    onChange(e.target.value);
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
        className={cn(inputBase, 'block h-[34px]')}
        placeholder="Enter text result..."
      />
    );
  }

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
      className={cn(inputBase, 'block h-[34px] pr-12 relative z-10', noSpinner, hasError && inputError)}
      placeholder="--"
    />
  );
};
