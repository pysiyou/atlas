/**
 * PopoverFormChrome — header, scroll body, and cancel/confirm footer for anchored forms.
 * Used by lab workflow popovers, payment popover, and similar flows.
 */

import React, { type ReactNode } from 'react';
import { actionButtonPreset, Button } from '@/components/primitives';
import { FooterInfo } from '@/components/display/FooterInfo';
import { Icon } from '@/components/primitives/Icon';
import { DialogHeader, DialogFooter } from './DialogChrome';
import { MODULE_ICONS } from '@/config/icons';
import { ICONS } from '@/config/icons';
import { cn } from '@/utils';
import { MENU_ITEM, RADIUS, TONE, TYPE } from '@/components/theme/recipes';

export interface PopoverFormChromeProps {
  title: string;
  subtitle?: string | ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmVariant: 'primary' | 'danger' | 'success';
  isSubmitting?: boolean;
  disabled?: boolean;
  footerInfo?: ReactNode;
  headerBadges?: ReactNode;
  children: ReactNode;
}

export const PopoverFormChrome: React.FC<PopoverFormChromeProps> = ({
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
}) => (
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
      start={footerInfo ?? <FooterInfo icon={MODULE_ICONS.laboratory} label="Laboratory" />}
      end={
        <>
          <Button
            {...actionButtonPreset('cancel')}
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

export interface RadioCardProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  description?: React.ReactNode;
  leading?: React.ReactNode;
  align?: 'start' | 'center';
  variant?: 'sky' | 'red' | 'warning';
  name: string;
  disabled?: boolean;
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
            className={`block ${TYPE.label} font-normal ${disabled ? 'text-text-disabled' : 'text-text-secondary'}`}
          >
            {label}
          </span>
          {hasDescription ? (
            <span
              className={`block ${TYPE.caption} mt-space-0-5 ${disabled ? 'text-text-disabled' : 'text-text-tertiary'}`}
            >
              {description}
            </span>
          ) : null}
          {disabled && disabledReason ? (
            <span className={`block ${TYPE.caption} mt-space-1 ${TONE.danger.fg} font-normal`}>{disabledReason}</span>
          ) : null}
        </div>
      </div>
      <div
        className={`
          absolute top-1/2 -translate-y-1/2 right-space-2 w-5 h-5 ${RADIUS.pill} flex items-center justify-center transition-colors duration-200
          ${selected ? 'bg-brand' : 'bg-transparent border-2 border-border-strong'}
        `}
      >
        {selected && <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />}
      </div>
    </div>
  );
};
