/**
 * LabWorkflowPopoverChrome - Reusable popover form container
 *
 * Provides a consistent structure for all lab workflow popovers:
 * - Header with title, subtitle, and close button
 * - Scrollable body area for form content
 * - Footer with user info and action buttons
 */

import React, { type ReactNode } from 'react';
import { Button, FooterInfo, Icon, DialogHeader, DialogFooter } from '@/components';
import { MODULE_ICONS } from '@/config/icons';
import { ICONS } from '@/config/icons';
import { cn } from '@/utils';
import { MENU_ITEM, RADIUS, TONE } from '@/components/theme/recipes';

interface LabWorkflowPopoverChromeProps {
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
 * LabWorkflowPopoverChrome provides the shared structure for lab workflow popovers
 *
 * Structure:
 * - Header: title, subtitle, close button
 * - Body: scrollable content area
 * - Footer: user info + cancel/confirm buttons
 */
export const LabWorkflowPopoverChrome: React.FC<LabWorkflowPopoverChromeProps> = ({
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
    <div className="flex w-90 md:w-96 max-h-[600px] min-w-0 flex-col overflow-hidden">
      <DialogHeader
        size="popover"
        title={title}
        subtitle={subtitle}
        badges={headerBadges}
        onClose={onCancel}
        disabled={isSubmitting}
      />
      <div className="p-panel space-y-space-4 overflow-y-auto flex-1">{children}</div>
      <DialogFooter
        density="popover"
        start={footerInfo || <FooterInfo icon={MODULE_ICONS.laboratory} label="Laboratory" />}
        end={
          <>
            <Button
              variant="cancel"
              size="sm"
              layout="text"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={confirmVariant}
              size="sm"
              layout="text"
              onClick={onConfirm}
              isLoading={isSubmitting}
              disabled={disabled}
            >
              {confirmLabel}
            </Button>
          </>
        }
      />
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
      className={cn(
        'relative flex p-space-3 bg-surface',
        MENU_ITEM.base,
        MENU_ITEM.interactive,
        align === 'center' ? 'items-center' : 'items-start',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
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
        className={`flex-1 min-w-0 pr-space-8 flex gap-space-2-5 ${align === 'center' ? 'items-center' : 'items-start'}`}
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
              className={`block text-xxs mt-space-0-5 ${disabled ? 'text-text-disabled' : 'text-text-tertiary'}`}
            >
              {description}
            </span>
          ) : null}
          {disabled && disabledReason ? (
            <span className={`block text-xxs mt-space-1 ${TONE.danger.fg} font-normal`}>{disabledReason}</span>
          ) : null}
        </div>
      </div>
      <div
        className={`
          absolute top-1/2 -translate-y-1/2 right-2 w-5 h-5 ${RADIUS.pill} flex items-center justify-center transition-colors duration-200
          ${selected ? 'bg-brand' : 'bg-transparent border-2 border-border-strong'}
        `}
      >
        {selected && <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />}
      </div>
    </div>
  );
};
