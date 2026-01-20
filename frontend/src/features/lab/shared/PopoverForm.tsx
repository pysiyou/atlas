/**
 * PopoverForm - Reusable popover form container
 * 
 * Provides a consistent structure for all lab workflow popovers:
 * - Header with title, subtitle, and close button
 * - Scrollable body area for form content
 * - Footer with user info and action buttons
 */

import React, { type ReactNode } from 'react';
import { Button, Icon } from '@/shared/ui';
import { useAuth } from '@/hooks';

interface PopoverFormProps {
  /** Main title displayed in the header */
  title: string;
  /** Optional subtitle displayed below the title */
  subtitle?: string;
  /** Cancel handler - closes the popover */
  onCancel: () => void;
  /** Confirm handler - submits the form */
  onConfirm: () => void;
  /** Label for the confirm button */
  confirmLabel: string;
  /** Visual variant for the confirm button */
  confirmVariant: 'primary' | 'danger' | 'success';
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Whether the confirm button should be disabled */
  disabled?: boolean;
  /** Optional custom content for the footer left side (defaults to user info) */
  footerInfo?: ReactNode;
  /** Optional header badges/tags displayed after title */
  headerBadges?: ReactNode;
  /** Form content */
  children: ReactNode;
}

/**
 * PopoverForm provides the shared structure for lab workflow popovers
 * 
 * Structure:
 * - Header: title, subtitle, close button
 * - Body: scrollable content area
 * - Footer: user info + cancel/confirm buttons
 */
export const PopoverForm: React.FC<PopoverFormProps> = ({
  title,
  subtitle,
  onCancel,
  onConfirm,
  confirmLabel,
  confirmVariant,
  isSubmitting = false,
  disabled = false,
  footerInfo,
  headerBadges,
  children,
}) => {
  const { currentUser } = useAuth();

  return (
    <div className="w-90 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-start justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900">{title}</h4>
            {headerBadges}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 mt-0.5 cursor-pointer">
          <Icon name="close" className="w-4 h-4" />
        </button>
      </div>

      {/* Body - scrollable content area */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {children}
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2 shrink-0">
        <div className="text-xs text-gray-500 flex items-center gap-1.5">
          {footerInfo || (
            <>
              <Icon name="alert-circle" className="w-3.5 h-3.5" />
              <span>Acting as {currentUser?.name || 'Lab Staff'}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            size="sm"
            onClick={onConfirm}
            isLoading={isSubmitting}
            disabled={disabled}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * RadioCard - Styled radio option card for use in popover forms
 */
interface RadioCardProps {
  /** Whether this option is selected */
  selected: boolean;
  /** Click handler to select this option */
  onClick: () => void;
  /** Main label text */
  label: string;
  /** Description text below the label */
  description: string;
  /** Color variant when selected */
  variant?: 'blue' | 'red';
  /** Radio input name for grouping */
  name: string;
  /** Whether the option is disabled */
  disabled?: boolean;
  /** Optional reason why the option is disabled (shown as tooltip) */
  disabledReason?: string;
}

export const RadioCard: React.FC<RadioCardProps> = ({
  selected,
  onClick,
  label,
  description,
  variant = 'blue',
  name,
  disabled = false,
  disabledReason,
}) => {
  const selectedStyles = variant === 'red'
    ? 'bg-red-50 border-red-200 ring-1 ring-red-200'
    : 'bg-blue-50 border-blue-200 ring-1 ring-blue-200';
  
  const disabledStyles = 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60';
  
  const labelColor = disabled
    ? 'text-gray-400'
    : variant === 'red'
      ? (selected ? 'text-red-900' : 'text-gray-900')
      : (selected ? 'text-blue-900' : 'text-gray-900');
  
  const descColor = disabled
    ? 'text-gray-400'
    : variant === 'red'
      ? (selected ? 'text-red-700' : 'text-gray-500')
      : (selected ? 'text-blue-700' : 'text-gray-500');

  const radioColor = variant === 'red' ? 'text-red-600 focus:ring-red-500' : 'text-blue-600 focus:ring-blue-500';

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <div
      className={`
        relative flex items-start p-3 rounded-lg border transition-all duration-200
        ${disabled 
          ? disabledStyles 
          : selected 
            ? selectedStyles 
            : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
        }
      `}
      onClick={handleClick}
      title={disabled ? disabledReason : undefined}
    >
      <div className="flex items-center h-4 mt-0.5">
        <input
          type="radio"
          name={name}
          checked={selected}
          onChange={handleClick}
          disabled={disabled}
          className={`h-3.5 w-3.5 border-gray-300 ${radioColor} ${disabled ? 'cursor-not-allowed' : ''}`}
        />
      </div>
      <div className="ml-2.5">
        <span className={`block text-xs font-medium ${labelColor}`}>{label}</span>
        <span className={`block text-[10px] mt-0.5 ${descColor}`}>{description}</span>
        {disabled && disabledReason && (
          <span className="block text-[10px] mt-1 text-red-500 font-medium">{disabledReason}</span>
        )}
      </div>
    </div>
  );
};

/**
 * CheckboxCard - Styled checkbox option card for use in popover forms
 */
interface CheckboxCardProps {
  /** Whether this option is checked */
  checked: boolean;
  /** Change handler */
  onChange: () => void;
  /** Main label text */
  label: string;
  /** Description text below the label */
  description: string;
}

export const CheckboxCard: React.FC<CheckboxCardProps> = ({
  checked,
  onChange,
  label,
  description,
}) => (
  <div
    className={`
      relative flex items-start p-3 cursor-pointer rounded-lg border transition-all duration-200
      ${checked
        ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }
    `}
    onClick={onChange}
  >
    <div className="flex items-center h-4 mt-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 text-blue-600 border-gray-300 focus:ring-blue-500 rounded"
      />
    </div>
    <div className="ml-2.5">
      <span className={`block text-xs font-medium ${checked ? 'text-blue-900' : 'text-gray-900'}`}>
        {label}
      </span>
      <span className={`block text-[10px] mt-0.5 ${checked ? 'text-blue-700' : 'text-gray-500'}`}>
        {description}
      </span>
    </div>
  </div>
);
