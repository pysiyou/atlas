/**
 * PopoverForm - Reusable popover form container
 *
 * Provides a consistent structure for all lab workflow popovers:
 * - Header with title, subtitle, and close button
 * - Scrollable body area for form content
 * - Footer with user info and action buttons
 */

import React, { type ReactNode } from 'react';
import { Button, IconButton, FooterInfo, Icon } from '@/components';
import { MODULE_ICONS } from '@/config/icons';
import { ICONS } from '@/config/icons';

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
  return (
    <div className="w-90 md:w-96 bg-surface rounded-lg shadow-xl border border-border-default overflow-hidden flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="px-4 py-3 bg-surface-page border-b border-border-subtle flex items-start justify-between">
        <div className="space-y-0.5">
          <h4 className="font-medium text-text-primary">{title}</h4>
          {subtitle && <p className="text-xs text-text-tertiary">{subtitle}</p>}
          {headerBadges && <div className="flex items-center gap-2 pt-1">{headerBadges}</div>}
        </div>
        <IconButton
          onClick={onCancel}
          variant="close"
          size="sm"
          title="Close"
          disabled={isSubmitting}
        />
      </div>

      {/* Body - scrollable content area */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">{children}</div>

      {/* Footer */}
      <div className="p-3 bg-surface-page border-t border-border-subtle flex items-center justify-between gap-2 shrink-0">
        {footerInfo || <FooterInfo icon={MODULE_ICONS.laboratory} label="Laboratory" />}
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
 * RadioCard - Styled radio option card for lab workflow popovers.
 *
 * Matches PaymentMethodSelector: static border and text; only the checkmark appears when selected.
 */
export interface RadioCardProps {
  /** Whether this option is selected */
  selected: boolean;
  /** Click handler to select this option */
  onClick: () => void;
  /** Main label text */
  label: string;
  /** Optional description content below the label */
  description?: React.ReactNode;
  /** Optional leading content (e.g. icon) */
  leading?: React.ReactNode;
  /** Vertical alignment for leading content and label block */
  align?: 'start' | 'center';
  /** Color variant when selected (unused visually; kept for API compatibility) */
  variant?: 'sky' | 'red' | 'warning';
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
  leading,
  align = 'start',
  name,
  disabled = false,
  disabledReason,
}) => {
  const handleClick = () => {
    if (!disabled) onClick();
  };

  const hasDescription =
    description != null && description !== '' && description !== false;

  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={e => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`
        relative flex p-3 rounded border border-border-default bg-surface hover:border-border-strong transition-colors duration-200
        ${align === 'center' ? 'items-center' : 'items-start'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onClick={handleClick}
      title={disabled ? disabledReason : undefined}
    >
      <input
        type="radio"
        name={name}
        checked={selected}
        onChange={handleClick}
        disabled={disabled}
        className="sr-only"
        aria-hidden
      />
      <div
        className={`flex-1 min-w-0 pr-8 flex gap-2.5 ${align === 'center' ? 'items-center' : 'items-start'}`}
      >
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <div className="min-w-0 flex-1">
          <span
            className={`block text-xs font-normal ${disabled ? 'text-text-disabled' : 'text-text-secondary'}`}
          >
            {label}
          </span>
          {hasDescription ? (
            <span
              className={`block text-xxs mt-0.5 ${disabled ? 'text-text-disabled' : 'text-text-tertiary'}`}
            >
              {description}
            </span>
          ) : null}
          {disabled && disabledReason ? (
            <span className="block text-xxs mt-1 text-danger-fg font-normal">{disabledReason}</span>
          ) : null}
        </div>
      </div>
      <div
        className={`
          absolute top-1/2 -translate-y-1/2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-200
          ${selected ? 'bg-brand' : 'bg-transparent border-2 border-border-strong'}
        `}
      >
        {selected && <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />}
      </div>
    </div>
  );
};
