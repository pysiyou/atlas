import React from 'react';

export interface FormFieldWrapperProps {
  label?: string;
  error?: string;
  helperText?: string;
  id?: string;
  required?: boolean;
  className?: string; // wrapper class
  children: React.ReactNode;
}

/**
 * FormFieldWrapper
 *
 * Wraps form inputs (Input, Textarea, Select) with standard label,
 * error message, and helper text rendering. eliminates duplication across input components.
 */
export const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  label,
  error,
  helperText,
  id,
  required,
  className = 'w-full group',
  children,
}) => {
  return (
    <div className={className}>
       {label && (
        <div className="flex justify-between items-baseline mb-1 gap-2">
          <label
            htmlFor={id}
            className="text-xs font-normal text-text-tertiary cursor-pointer truncate min-w-0"
          >
            {label}
            {required && <span className="text-danger-fg ml-1">*</span>}
          </label>
        </div>
      )}
      
      {children}
      
      {error && <p className="text-danger-fg text-xs mt-1">{error}</p>}
      {helperText && !error && (
        <p className="text-text-tertiary text-xs mt-1">{helperText}</p>
      )}
    </div>
  );
};
