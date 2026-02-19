/**
 * FormField — Reusable form controls: Input, Textarea, Select.
 * All standard form field components live here to keep the file in one place.
 * Uses FormFieldWrapper to handle label, error, and helper text rendering consistently.
 */

import React, { type InputHTMLAttributes } from 'react';
import { Icon, type IconName } from '@/components/primitives/Icon';
import { ICONS } from '@/utils';
import { inputBase, inputError } from '@/components/inputs/inputStyles';
import { FormFieldWrapper } from './FormFieldWrapper';

const getInputClasses = (hasError: boolean, hasIcon: boolean) => {
  const iconPadding = hasIcon ? 'pl-10' : '';
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

  const getDefaultIcon = (): IconName | undefined => {
    if (icon !== undefined) return icon;
    const type = props.type;
    const name = props.name?.toLowerCase() || '';
    if (type === 'email' || name.includes('email')) return 'mail';
    if (type === 'tel' || name.includes('phone')) return 'phone';
    if (name.includes('height')) return 'ruler';
    if (name.includes('weight')) return 'weight';
    if (name.includes('name')) return 'user';
    if (name.includes('address') || name.includes('street')) return 'map';
    if (name.includes('city')) return 'city';
    if (name.includes('postal') || name.includes('zip')) return 'mail';
    return undefined;
  };

  const displayIcon = getDefaultIcon();

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
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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

  const getDefaultIcon = (): IconName | undefined => {
    if (icon !== undefined) return icon;
    const name = props.name?.toLowerCase() || '';
    if (name.includes('note') || name.includes('comment')) return ICONS.actions.pen;
    if (name.includes('history') || name.includes('medical')) return ICONS.dataFields.medicalKit;
    if (name.includes('description')) return ICONS.dataFields.document;
    return ICONS.dataFields.document;
  };

  const displayIcon = getDefaultIcon();

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

  const getDefaultIcon = (): IconName | undefined => {
    if (icon !== undefined) return icon;
    const name = props.name?.toLowerCase() || '';
    if (name.includes('gender')) return ICONS.dataFields.userHands;
    if (name.includes('relationship')) return ICONS.ui.link;
    if (name.includes('duration') || name.includes('affiliation')) return ICONS.dataFields.time;
    return ICONS.actions.infoCircle;
  };

  const displayIcon = getDefaultIcon();

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
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
