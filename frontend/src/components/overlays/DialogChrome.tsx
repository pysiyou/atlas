/**
 * Shared dialog chrome — modal sheets and popover forms.
 */

import { type ReactNode } from 'react';
import { IconButton } from '@/components/primitives';
import { cn } from '@/utils';

export type DialogChromeSize = 'modal' | 'popover';

const HEADER_CLASS: Record<DialogChromeSize, string> = {
  modal:
    'px-6 py-3.5 border-b border-border-default bg-surface flex items-center justify-between shrink-0',
  popover:
    'px-4 py-3 bg-surface-page border-b border-border-subtle flex items-start justify-between shrink-0',
};

const TITLE_CLASS: Record<DialogChromeSize, string> = {
  modal: 'text-base font-medium text-text-primary truncate leading-snug',
  popover: 'font-medium text-text-primary',
};

const SUBTITLE_CLASS: Record<DialogChromeSize, string> = {
  modal: 'text-sm text-text-tertiary leading-snug',
  popover: 'text-xs text-text-tertiary',
};

const FOOTER_CLASS: Record<DialogChromeSize, string> = {
  modal:
    'flex items-center justify-between gap-3 px-6 py-4 border-t border-border-default bg-surface shrink-0 shadow-[var(--shadow-footer)]',
  popover:
    'p-3 bg-surface-page border-t border-border-subtle flex items-center justify-between gap-2 shrink-0',
};

export interface DialogHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  onClose?: () => void;
  disabled?: boolean;
  size?: DialogChromeSize;
  titleId?: string;
  actions?: ReactNode;
  closeSize?: 'sm' | 'md';
}

export function DialogHeader({
  title,
  subtitle,
  badges,
  onClose,
  disabled = false,
  size = 'modal',
  titleId,
  actions,
  closeSize,
}: DialogHeaderProps) {
  const TitleTag = size === 'popover' ? 'h4' : 'h2';
  const resolvedCloseSize = closeSize ?? (size === 'popover' ? 'sm' : 'md');

  return (
    <div className={HEADER_CLASS[size]}>
      <div className={size === 'popover' ? 'space-y-0.5 min-w-0' : 'flex items-start gap-3 min-w-0'}>
        <div className="flex flex-col min-w-0 gap-0.5">
          <TitleTag
            id={titleId}
            className={TITLE_CLASS[size]}
            title={typeof title === 'string' ? title : undefined}
          >
            {title}
          </TitleTag>
          {subtitle != null && subtitle !== false && (
            <div className={SUBTITLE_CLASS[size]}>{subtitle}</div>
          )}
          {badges != null && <div className="flex items-center gap-2 pt-1">{badges}</div>}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        {onClose != null && (
          <IconButton
            onClick={onClose}
            variant="close"
            size={resolvedCloseSize}
            title="Close"
            disabled={disabled}
          />
        )}
        {actions}
      </div>
    </div>
  );
}

export interface DialogFooterProps {
  start?: ReactNode;
  end?: ReactNode;
  density?: DialogChromeSize;
  className?: string;
}

export function DialogFooter({
  start,
  end,
  density = 'modal',
  className,
}: DialogFooterProps) {
  return (
    <div className={cn(FOOTER_CLASS[density], className)}>
      {start}
      {end != null && (
        <div
          className={cn(
            'flex items-center shrink-0',
            density === 'popover' ? 'gap-2' : 'gap-3',
          )}
        >
          {end}
        </div>
      )}
    </div>
  );
}
