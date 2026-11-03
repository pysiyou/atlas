/**
 * FormField — Reusable form controls: Input, Textarea, Select.
 * All standard form field components live here to keep the file in one place.
 * Uses FormFieldWrapper to handle label, error, and helper text rendering consistently.
 */

import React, { type InputHTMLAttributes } from 'react';
import { Icon } from '@/components/primitives/Icon';
import { IconKeys } from '@/config/icons';
import type { IconKey } from '@/config/icons';
import { text, inputBase, inputError, FORM_CONTROL_LABEL } from '@/theme/recipes';
import { FIELD_ERROR, SPACING, TONE } from '@/theme/recipes';

type FormFieldKind = 'input' | 'textarea' | 'select';

function getDefaultIconForInput(name: string, type: string): IconKey | undefined {
  if (type === 'email' || name.includes('email')) return IconKeys.dataFields.email;
  if (type === 'tel' || name.includes('phone')) return IconKeys.dataFields.phone;
  if (name.includes('emergencyContactFullName')) return IconKeys.ui.link;
  if (name.includes('height')) return IconKeys.dataFields.height;
  if (name.includes('weight')) return IconKeys.dataFields.weight;
  if (name.includes('name')) return IconKeys.dataFields.user;
  if (name.includes('address') || name.includes('street')) return IconKeys.dataFields.address;
  if (name.includes('city')) return IconKeys.ui.city;
  if (name.includes('postal') || name.includes('zip')) return IconKeys.dataFields.location;
  return undefined;
}

function getDefaultIconForTextarea(name: string): IconKey {
  if (name.includes('note') || name.includes('comment')) return IconKeys.actions.edit;
  if (name.includes('history') || name.includes('medical')) return IconKeys.dataFields.medicalKit;
  return IconKeys.dataFields.document;
}

function getDefaultIconForSelect(name: string): IconKey {
  if (name.includes('gender')) return IconKeys.dataFields.userHands;
  if (name.includes('relationship')) return IconKeys.ui.link;
  if (name.includes('duration') || name.includes('affiliation')) return IconKeys.dataFields.time;
  return IconKeys.actions.infoCircle;
}

function getDefaultIconForField(
  kind: FormFieldKind,
  explicitIcon: IconKey | undefined,
  inferIcon: boolean,
  type?: string,
  name?: string
): IconKey | undefined {
  if (explicitIcon !== undefined) return explicitIcon;
  if (!inferIcon) return undefined;

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
    {error && <p className={`${FIELD_ERROR} mt-space-1`}>{error}</p>}
    {helperText && !error && <p className={`${text({ role: 'body', intent: 'muted' })} mt-space-1`}>{helperText}</p>}
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
  icon?: IconKey;
  /** When true, pick a default icon from the input `name` / `type`. */
  inferIcon?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  icon,
  inferIcon = false,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const displayIcon = getDefaultIconForField('input', icon, inferIcon, props.type, props.name);

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
              iconKey={displayIcon}
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
  icon?: IconKey;
  inferIcon?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  icon,
  inferIcon = false,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const displayIcon = getDefaultIconForField('textarea', icon, inferIcon, undefined, props.name);

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
          <div className="absolute top-space-2-5 left-space-3 pointer-events-none">
            <Icon
              iconKey={displayIcon}
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
  icon?: IconKey;
  inferIcon?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  className = '',
  id,
  icon,
  inferIcon = false,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const displayIcon = getDefaultIconForField('select', icon, inferIcon, undefined, props.name);

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
              iconKey={displayIcon}
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
