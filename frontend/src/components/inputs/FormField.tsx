/**
 * FormField — Reusable form controls: Input, Textarea, Select.
 * All standard form field components live here to keep the file in one place.
 * Uses FormFieldWrapper to handle label, error, and helper text rendering consistently.
 */

import React, { type InputHTMLAttributes } from 'react';
import { Icon, type IconName } from '@/components/primitives/Icon';
import { ICONS } from '@/config/icons';
import { inputBase, inputError, FORM_CONTROL_LABEL } from '@/components/inputs/inputStyles';
import { SPACING, TONE, TYPE } from '@/components/theme/recipes';

type FormFieldKind = 'input' | 'textarea' | 'select';

function getDefaultIconForInput(name: string, type: string): IconName | undefined {
  if (type === 'email' || name.includes('email')) return 'mail';
  if (type === 'tel' || name.includes('phone')) return 'phone';
  if (name.includes('height')) return 'ruler';
  if (name.includes('weight')) return 'weight';
  if (name.includes('name')) return 'user';
  if (name.includes('address') || name.includes('street')) return 'map';
  if (name.includes('city')) return 'city';
  if (name.includes('postal') || name.includes('zip')) return 'mail';
  return undefined;
}

function getDefaultIconForTextarea(name: string): IconName {
  if (name.includes('note') || name.includes('comment')) return ICONS.actions.pen;
  if (name.includes('history') || name.includes('medical')) return ICONS.dataFields.medicalKit;
  return ICONS.dataFields.document;
}

function getDefaultIconForSelect(name: string): IconName {
  if (name.includes('gender')) return ICONS.dataFields.userHands;
  if (name.includes('relationship')) return ICONS.ui.link;
  if (name.includes('duration') || name.includes('affiliation')) return ICONS.dataFields.time;
  return ICONS.actions.infoCircle;
}

function getDefaultIconForField(
  kind: FormFieldKind,
  explicitIcon: IconName | undefined,
  type?: string,
  name?: string
): IconName | undefined {
  if (explicitIcon !== undefined) return explicitIcon;

  const n = (name ?? '').toLowerCase();
  const t = type ?? '';

  switch (kind) {
    case 'input':
      return getDefaultIconForInput(n, t);
    case 'textarea':
      return getDefaultIconForTextarea(n);
    case 'select':
      return getDefaultIconForSelect(n);
    default:
      return undefined;
  }
}

interface FormFieldWrapperProps {
  label?: string;
  error?: string;
  helperText?: string;
  id?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  label,
  error,
  helperText,
  id,
  required,
  className = 'w-full group',
  children,
}) => (
  <div className={className}>
    {label && (
      <div className="flex justify-between items-baseline mb-space-1 gap-space-2">
        <label htmlFor={id} className={FORM_CONTROL_LABEL}>
          {label}
          {required && <span className={`${TONE.danger.fg} ml-space-1`}>*</span>}
        </label>
      </div>
    )}
    {children}
    {error && <p className={`${TONE.danger.fg} text-xs mt-space-1`}>{error}</p>}
    {helperText && !error && <p className={`${TYPE.meta} mt-space-1`}>{helperText}</p>}
  </div>
);

const getInputClasses = (hasError: boolean, hasIcon: boolean) => {
  const iconPadding = hasIcon ? SPACING.plSpace10 : '';
  const stateClasses = hasError ? inputError : '';
  return `${inputBase} ${iconPadding} ${stateClasses}`.trim();
};

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: IconName;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  icon,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const displayIcon = getDefaultIconForField('input', icon, props.type, props.name);

  return (
    <FormFieldWrapper
      label={label}
      error={error}
      helperText={helperText}
      id={inputId}
      required={props.required}
      className={`w-full group ${className.includes('w-') ? '' : ''}`} // wrapper className handling if needed, but FormFieldWrapper defaults to w-full group. Let's pass className if it affects layout.
    >
      <div className="relative">
        {displayIcon && (
          <div className="absolute inset-y-0 left-0 pl-space-3 flex items-center pointer-events-none">
            <Icon
              name={displayIcon}
              className="w-4 h-4 text-text-muted group-hover:text-brand transition-colors"
            />
          </div>
        )}
        <input
          id={inputId}
          className={`${getInputClasses(!!error, !!displayIcon)} ${className}`}
          {...props}
        />
      </div>
    </FormFieldWrapper>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: IconName;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  icon,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const displayIcon = getDefaultIconForField('textarea', icon, undefined, props.name);

  return (
    <FormFieldWrapper
      label={label}
      error={error}
      helperText={helperText}
      id={inputId}
      required={props.required}
    >
      <div className="relative">
        {displayIcon && (
          <div className="absolute top-2.5 left-3 pointer-events-none">
            <Icon
              name={displayIcon}
              className="w-4 h-4 text-text-muted group-hover:text-brand transition-colors"
            />
          </div>
        )}
        <textarea
          id={inputId}
          className={`${getInputClasses(!!error, !!displayIcon)} ${className}`}
          rows={4}
          {...props}
        />
      </div>
    </FormFieldWrapper>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: readonly { value: string; label: string }[] | { value: string; label: string }[];
  icon?: IconName;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  className = '',
  id,
  icon,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const displayIcon = getDefaultIconForField('select', icon, undefined, props.name);

  return (
    <FormFieldWrapper
      label={label}
      error={error}
      helperText={helperText}
      id={inputId}
      required={props.required}
    >
      <div className="relative">
        {displayIcon && (
          <div className="absolute inset-y-0 left-0 pl-space-3 flex items-center pointer-events-none">
            <Icon
              name={displayIcon}
              className="w-4 h-4 text-text-muted group-hover:text-brand transition-colors"
            />
          </div>
        )}
        <select
          id={inputId}
          className={`${getInputClasses(!!error, !!displayIcon)} cursor-pointer ${className}`}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
    </FormFieldWrapper>
  );
};
