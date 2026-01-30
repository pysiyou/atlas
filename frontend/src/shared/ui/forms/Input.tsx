/**
 * Input Component
 * Reusable form input with label and error handling
 */

import React, { type InputHTMLAttributes } from 'react';
import { Icon, type IconName } from '../display/Icon';
import { ICONS } from '@/utils';

/**
 * Get input classes based on state
 */
const getInputClasses = (hasError: boolean, hasIcon: boolean, disabled?: boolean) => {
  const baseClasses = 'w-full rounded border px-3 py-2 text-xs transition-colors duration-200 focus:outline-none focus:ring-2 placeholder:text-text-muted';
  const iconPadding = hasIcon ? 'pl-10' : '';
  const stateClasses = hasError
    ? 'border-border-error focus:border-border-error focus:ring-action-danger focus:ring-opacity-20'
    : 'border-border-default focus:border-action-primary focus:ring-action-primary focus:ring-opacity-20';
  const disabledClasses = disabled ? 'bg-neutral-100 text-text-disabled cursor-not-allowed' : 'bg-surface-default';
  
  return `${baseClasses} ${iconPadding} ${stateClasses} ${disabledClasses}`;
};

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: IconName;
}

export const Input: React.FC<InputProps> = ({
  label: labelProp,
  error,
  helperText: helperTextProp,
  className = '',
  id,
  icon,
  ...props
}) => {
  const inputId = id || labelProp?.toLowerCase().replace(/\s+/g, '-');

  // Auto-detect icon based on input type or name if not provided
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
    <div className="w-full group">
      {labelProp && (
        <div className="flex justify-between items-baseline mb-1 gap-2">
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-text-tertiary cursor-pointer truncate min-w-0"
          >
            {labelProp}
            {props.required && <span className="text-feedback-danger-text ml-1">*</span>}
          </label>
        </div>
      )}
      <div className="relative">
        {displayIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name={displayIcon} className="w-4 h-4 text-text-muted" />
          </div>
        )}
        <input
          id={inputId}
          className={`${getInputClasses(!!error, !!displayIcon, props.disabled)} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-feedback-danger-text text-xs mt-1">{error}</p>}
      {helperTextProp && !error && <p className="text-text-tertiary text-xs mt-1">{helperTextProp}</p>}
    </div>
  );
};

/**
 * Textarea Component
 */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: IconName;
}

export const Textarea: React.FC<TextareaProps> = ({
  label: labelProp,
  error,
  helperText: helperTextProp,
  className = '',
  id,
  icon,
  ...props
}) => {
  const inputId = id || labelProp?.toLowerCase().replace(/\s+/g, '-');

  // Auto-detect icon based on name if not provided
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
    <div className="w-full group">
      {labelProp && (
        <div className="flex justify-between items-baseline mb-1 gap-2">
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-text-tertiary cursor-pointer truncate min-w-0"
          >
            {labelProp}
            {props.required && <span className="text-feedback-danger-text ml-1">*</span>}
          </label>
        </div>
      )}
      <div className="relative">
        {displayIcon && (
          <div className="absolute top-2.5 left-3 pointer-events-none">
            <Icon name={displayIcon} className="w-4 h-4 text-text-muted" />
          </div>
        )}
        <textarea
          id={inputId}
          className={`${getInputClasses(!!error, !!displayIcon, props.disabled)} ${className}`}
          rows={4}
          {...props}
        />
      </div>
      {error && <p className="text-feedback-danger-text text-xs mt-1">{error}</p>}
      {helperTextProp && !error && <p className="text-text-tertiary text-xs mt-1">{helperTextProp}</p>}
    </div>
  );
};

/**
 * Select Component
 */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: readonly { value: string; label: string }[] | { value: string; label: string }[];
  icon?: IconName;
}

export const Select: React.FC<SelectProps> = ({
  label: labelProp,
  error,
  helperText: helperTextProp,
  options,
  className = '',
  id,
  icon,
  ...props
}) => {
  const inputId = id || labelProp?.toLowerCase().replace(/\s+/g, '-');

  // Auto-detect icon based on name if not provided
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
    <div className="w-full group">
      {labelProp && (
        <div className="flex justify-between items-baseline mb-1 gap-2">
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-text-tertiary cursor-pointer truncate min-w-0"
          >
            {labelProp}
            {props.required && <span className="text-feedback-danger-text ml-1">*</span>}
          </label>
        </div>
      )}
      <div className="relative">
        {displayIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name={displayIcon} className="w-4 h-4 text-text-muted" />
          </div>
        )}
        <select
          id={inputId}
          className={`${getInputClasses(!!error, !!displayIcon, props.disabled)} cursor-pointer ${className}`}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-feedback-danger-text text-xs mt-1">{error}</p>}
      {helperTextProp && !error && <p className="text-text-tertiary text-xs mt-1">{helperTextProp}</p>}
    </div>
  );
};
