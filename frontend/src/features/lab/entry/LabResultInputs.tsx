/**
 * Lab result entry inputs — radio select, numeric, and text fields per analyte.
 */

import React, { useCallback } from 'react';
import { Popover } from '@/components/overlays';
import { Icon } from '@/components/primitives';
import { text, CONTROL, RADIUS , FG } from '@/theme/recipes';
import { inputTrigger, inputTriggerOpen, inputBase, inputError } from '@/theme/recipes';
import { cn } from '@/utils';
import { IconKeys } from '@/icons';
import type { AnalyteDefinition } from '@/types';
import type { PhysiologicLimit } from '../utils/labResult';
import { validatePhysiologicValue } from '../utils';
import { titleCaseWords } from '@/utils/string';
import { RadioCard } from '@/components/overlays';

function SelectAnalyteValueInput({
  analyte,
  value,
  onChange,
  inputId,
  disabled = false,
}: {
  analyte: AnalyteDefinition;
  value: string;
  onChange: (value: string) => void;
  inputId: string;
  disabled?: boolean;
}) {
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
            'w-full',
            isOpen && inputTriggerOpen,
            disabled && 'opacity-60 pointer-events-none',
          )}
        >
          <div className={`flex-1 ${text({ role: 'body' })} truncate`}>
            {value ? (
              <span className={FG.body}>{titleCaseWords(value)}</span>
            ) : (
              <span className={FG.disabled}>-- Select --</span>
            )}
          </div>
          <Icon iconKey={IconKeys.actions.chevronDown}
            className={cn(
              'w-4 h-4 ${FG.disabled} transition-transform flex-shrink-0',
              isOpen && 'rotate-180'
            )}
          />
          {value && (
            <button
              onClick={handleClear}
              className={`p-space-0-5 -mr-space-1 hover:bg-surface-hover ${RADIUS.field} transition-colors flex items-center justify-center cursor-pointer flex-shrink-0`}
            >
              <Icon iconKey={IconKeys.actions.close}
                className={`w-4 h-4 ${FG.disabled} hover:${FG.captionMuted}`}
              />
            </button>
          )}
        </div>
      )}
      className="min-w-[200px]"
    >
      {({ close }) => (
        <div className="flex flex-col gap-space-2 p-space-2 max-h-[250px] overflow-y-auto">
          {analyte.allowed_values?.map((option: string) => (
            <RadioCard
              key={option}
              name={`entry-analyte-${inputId}`}
              label={titleCaseWords(option)}
              selected={value === option}
              align="center"
              onClick={() => {
                onChange(option);
                close();
              }}
            />
          ))}
        </div>
      )}
    </Popover>
  );
}

export function LabResultInput({
  analyte,
  value,
  onChange,
  onKeyDown,
  inputId,
  validationError,
  onValidationChange,
  disabled,
}: {
  analyte: AnalyteDefinition;
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  inputId: string;
  validationError?: string;
  onValidationChange?: (error: string | undefined) => void;
  disabled?: boolean;
}) {
  const valueType = analyte.value_type ?? 'TEXT';
  const normalizedValue = value ?? '';
  const phys = analyte.physiologic_range as PhysiologicLimit | null | undefined;
  const limit =
    valueType === 'NUMERIC' && phys?.min !== undefined && phys?.max !== undefined ? phys : undefined;

  const handleBlur = useCallback(() => {
    if (valueType !== 'NUMERIC' || !normalizedValue) {
      onValidationChange?.(undefined);
      return;
    }
    const result = validatePhysiologicValue(normalizedValue, limit);
    onValidationChange?.(result.error);
  }, [normalizedValue, valueType, onValidationChange, limit]);

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
    disabled,
  };

  const selectOptions =
    analyte.allowed_values?.filter((v): v is string => typeof v === 'string' && v.trim() !== '') ?? [];

  if (valueType === 'SELECT' && selectOptions.length > 0) {
    return (
      <SelectAnalyteValueInput
        analyte={{ ...analyte, allowed_values: selectOptions }}
        value={normalizedValue}
        onChange={onChange}
        inputId={inputId}
        disabled={disabled}
      />
    );
  }

  if (valueType === 'SELECT' || valueType === 'TEXT') {
    const placeholder =
      valueType === 'SELECT' ? 'Catalog options missing — enter coded value' : 'Enter text result...';
    return (
      <input
        {...commonProps}
        type="text"
        className={cn(inputBase, `block ${CONTROL.height}`)}
        placeholder={placeholder}
      />
    );
  }

  const hasError = !!validationError;
  const decimals = analyte.decimals_suggested;
  const step =
    typeof decimals === 'number' && decimals >= 0 && Number.isInteger(decimals)
      ? decimals === 0
        ? '1'
        : (1 / 10 ** decimals).toString()
      : 'any';
  const noSpinner =
    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0';
  return (
    <input
      {...commonProps}
      type="number"
      step={step}
      min={limit?.min}
      max={limit?.max}
      inputMode="decimal"
      className={cn(inputBase, `block ${CONTROL.height} pr-space-12 relative z-10`, noSpinner, hasError && inputError)}
      placeholder="--"
    />
  );
}