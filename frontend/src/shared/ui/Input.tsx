/**
 * Input Component
 * Reusable form input with label and error handling
 */

import React, { type InputHTMLAttributes } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';

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
      {label && (
        <div className="flex justify-between items-baseline mb-1 gap-2">
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-gray-500 cursor-pointer truncate min-w-0"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
      )}
      <div className="relative">
        {displayIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name={displayIcon} className="w-4 h-4 text-gray-400" />
          </div>
        )}
        <input
          id={inputId}
          className={`
            block w-full ${displayIcon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 border rounded bg-white
            text-xs placeholder:text-gray-300 transition-shadow
            focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
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
  label,
  error,
  helperText,
  className = '',
  id,
  icon,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  // Auto-detect icon based on name if not provided
  const getDefaultIcon = (): IconName | undefined => {
    if (icon !== undefined) return icon;

    const name = props.name?.toLowerCase() || '';

    if (name.includes('note') || name.includes('comment')) return 'file-text';
    if (name.includes('history') || name.includes('medical')) return 'file-text';
    if (name.includes('description')) return 'file-text';

    return 'file-text';
  };

  const displayIcon = getDefaultIcon();

  return (
    <div className="w-full group">
      {label && (
        <div className="flex justify-between items-baseline mb-1 gap-2">
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-gray-500 cursor-pointer truncate min-w-0"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
      )}
      <div className="relative">
        {displayIcon && (
          <div className="absolute top-2.5 left-3 pointer-events-none">
            <Icon name={displayIcon} className="w-4 h-4 text-gray-400" />
          </div>
        )}
        <textarea
          id={inputId}
          className={`
            w-full ${displayIcon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 border rounded bg-white
            text-xs placeholder:text-gray-300 transition-shadow
            focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `}
          rows={4}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
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

  // Auto-detect icon based on name if not provided
  const getDefaultIcon = (): IconName | undefined => {
    if (icon !== undefined) return icon;

    const name = props.name?.toLowerCase() || '';

    if (name.includes('gender')) return 'user-hands';
    if (name.includes('relationship')) return 'link';
    if (name.includes('duration') || name.includes('affiliation')) return 'clock';

    return 'info-circle';
  };

  const displayIcon = getDefaultIcon();

  return (
    <div className="w-full group">
      {label && (
        <div className="flex justify-between items-baseline mb-1 gap-2">
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-gray-500 cursor-pointer truncate min-w-0"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
      )}
      <div className="relative">
        {displayIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name={displayIcon} className="w-4 h-4 text-gray-400" />
          </div>
        )}
        <select
          id={inputId}
          className={`
            block w-full ${displayIcon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 border rounded cursor-pointer bg-white
            text-xs transition-shadow
            focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};
