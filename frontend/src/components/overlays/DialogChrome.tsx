/**
 * Shared dialog chrome — modal sheets and popover forms.
 */

import { type ReactNode } from 'react';
import { actionButtonPreset, IconButton } from '@/components/primitives';
import { DIALOG, TYPE } from '@/components/theme/recipes';
import { cn } from '@/utils';

export type DialogChromeSize = 'modal' | 'popover';

const HEADER_CLASS: Record<DialogChromeSize, string> = {
  modal: DIALOG.modalHeader,
  popover: DIALOG.popoverHeader,
};

const TITLE_CLASS: Record<DialogChromeSize, string> = {
  modal: `${TYPE.modalTitle} truncate leading-snug`,
  popover: TYPE.detailTitle,
};

const SUBTITLE_CLASS: Record<DialogChromeSize, string> = {
  modal: `${TYPE.amount} text-text-tertiary leading-snug`,
  popover: TYPE.meta,
};

const FOOTER_CLASS: Record<DialogChromeSize, string> = {
  modal: DIALOG.modalFooter,
  popover: DIALOG.popoverFooter,
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

  const titleLine = (
    <TitleTag
      id={titleId}
      className={
        size === 'modal'
          ? badges != null
            ? cn(TYPE.modalTitle, 'leading-snug inline')
            : TITLE_CLASS.modal
          : TITLE_CLASS[size]
      }
      title={typeof title === 'string' ? title : undefined}
    >
      {title}
    </TitleTag>
  );

  const subtitleLine =
    subtitle != null && subtitle !== false ? (
      <div className={SUBTITLE_CLASS[size]}>{subtitle}</div>
    ) : null;

  const titleBlock = (
    <>
      {titleLine}
      {subtitleLine}
    </>
  );

  const closeControl =
    onClose != null ? (
      <IconButton
        onClick={onClose}
        {...actionButtonPreset('close')}
        size={resolvedCloseSize}
        title="Close"
        disabled={disabled}
      />
    ) : null;

  return (
    <div className={HEADER_CLASS[size]}>
      {size === 'modal' ? (
        <div className={DIALOG.modalHeaderGrid}>
          <div className={DIALOG.modalTitleStack}>
            <div className={DIALOG.modalTitleFirstLine}>
              {titleLine}
              {badges != null ? (
                <span className={DIALOG.modalBadgeInline}>{badges}</span>
              ) : null}
            </div>
            {subtitleLine}
          </div>
          <div className={DIALOG.modalCloseColumn}>
            {closeControl}
            {actions}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-space-0-5 min-w-0">
            {titleBlock}
            {badges != null ? <div className={DIALOG.modalBadges}>{badges}</div> : null}
          </div>
          <div className={DIALOG.headerActions}>
            {closeControl}
            {actions}
          </div>
        </>
      )}
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
            density === 'popover' ? 'gap-space-2' : 'gap-space-3',
          )}
        >
          {end}
        </div>
      )}
    </div>
  );
}
