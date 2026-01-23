/**
 * Input Component
 * Reusable form input with label and error handling
 */

import React, { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
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
      <input
        id={inputId}
        className={`
          block w-full px-3 py-2 border rounded bg-white
          placeholder:text-gray-300 placeholder:text-xs transition-shadow
          focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
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
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
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
      <textarea
        id={inputId}
        className={`
          w-full px-3 py-2 border rounded bg-white placeholder:text-gray-300 placeholder:text-xs
          focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `}
        rows={4}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
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
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
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
      <select
        id={inputId}
        className={`
          block w-full px-3 py-2 border rounded cursor-pointer bg-white transition-shadow
          focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
