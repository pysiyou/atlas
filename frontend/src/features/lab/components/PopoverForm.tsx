/**
 * PopoverForm - Reusable popover form container
 *
 * Provides a consistent structure for all lab workflow popovers:
 * - Header with title, subtitle, and close button
 * - Scrollable body area for form content
 * - Footer with user info and action buttons
 */

import React, { type ReactNode } from 'react';
import { Button, IconButton, FooterInfo } from '@/shared/ui';
import { useAuthStore } from '@/shared/stores/auth.store';
import { ICONS } from '@/utils';

interface PopoverFormProps {
  /** Main title displayed in the header */
  title: string;
  /** Optional subtitle displayed below the title */
  subtitle?: string | ReactNode;
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
  const { user: currentUser } = useAuthStore();

  return (
    <div className="w-90 md:w-96 bg-surface rounded-lg shadow-xl border border-border overflow-hidden flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="px-4 py-3 bg-app-bg border-b border-border-subtle flex items-start justify-between">
        <div className="space-y-0.5">
          <h4 className="font-medium text-text-primary">{title}</h4>
          {subtitle && <p className="text-xs text-text-tertiary">{subtitle}</p>}
          {headerBadges && <div className="flex items-center gap-2 pt-1">{headerBadges}</div>}
        </div>
        <IconButton onClick={onCancel} variant="close" size="sm" title="Close" />
      </div>

      {/* Body - scrollable content area */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">{children}</div>

      {/* Footer */}
      <div className="p-3 bg-app-bg border-t border-border-subtle flex items-center justify-between gap-2 shrink-0">
        {footerInfo || (
          <FooterInfo
            icon={ICONS.actions.alertCircle}
            text={`Acting as ${currentUser?.name || 'Lab Staff'}`}
          />
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="cancel"
            size="sm"
            showIcon={false}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            size="sm"
            showIcon={false}
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
  variant?: 'sky' | 'red';
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
  variant = 'sky',
  name,
  disabled = false,
  disabledReason,
}) => {
  const selectedStyles =
    variant === 'red'
      ? 'bg-red-50 border-red-200 ring-1 ring-red-200'
      : 'bg-sky-50 border-sky-200 ring-1 ring-sky-200';

  const disabledStyles = 'bg-neutral-100 border-border cursor-not-allowed opacity-60';

  const labelColor = disabled
    ? 'text-text-disabled'
    : variant === 'red'
      ? selected
        ? 'text-red-800'
        : 'text-text-primary'
      : selected
        ? 'text-sky-700'
        : 'text-text-primary';

  const descColor = disabled
    ? 'text-text-disabled'
    : variant === 'red'
      ? selected
        ? 'text-red-600'
        : 'text-text-tertiary'
      : selected
        ? 'text-brand'
        : 'text-text-tertiary';

  const radioColor =
    variant === 'red' ? 'text-red-600 focus:ring-red-500' : 'text-brand focus:ring-brand';

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <div
      className={`
        relative flex items-start p-3 rounded-lg border transition-all duration-200
        ${
          disabled
            ? disabledStyles
            : selected
              ? selectedStyles
              : 'bg-surface border-border hover:border-border-strong hover:bg-app-bg cursor-pointer'
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
          className={`h-3.5 w-3.5 border-border-strong ${radioColor} ${disabled ? 'cursor-not-allowed' : ''}`}
        />
      </div>
      <div className="ml-2.5">
        <span className={`block text-xs font-medium ${labelColor}`}>{label}</span>
        <span className={`block text-xxs mt-0.5 ${descColor}`}>{description}</span>
        {disabled && disabledReason && (
          <span className="block text-xxs mt-1 text-red-600 font-medium">{disabledReason}</span>
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
      ${
        checked
          ? 'bg-sky-50 border-sky-200 ring-1 ring-sky-200'
          : 'bg-surface border-border hover:border-border-strong hover:bg-app-bg'
      }
    `}
    onClick={onChange}
  >
    <div className="flex items-center h-4 mt-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 text-brand border-border-strong focus:ring-brand rounded"
      />
    </div>
    <div className="ml-2.5">
      <span className={`block text-xs font-medium ${checked ? 'text-sky-700' : 'text-text-primary'}`}>
        {label}
      </span>
      <span className={`block text-xxs mt-0.5 ${checked ? 'text-brand' : 'text-text-tertiary'}`}>
        {description}
      </span>
    </div>
  </div>
);
