/**
 * Shared dialog chrome — modal sheets and popover forms.
 */

import { type ReactNode } from 'react';
import { actionButtonPreset, IconButton } from '@/components/primitives';
import { DIALOG, TYPE } from '@/theme/recipes';
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
  /** Same scale as modal title (`type-step-xs`); tertiary body text vs medium modal title. */
  modal: `${TYPE.meta} leading-snug`,
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
      className={size === 'modal' ? TITLE_CLASS.modal : TITLE_CLASS[size]}
      title={typeof title === 'string' ? title : undefined}
    >
      {title}
    </TitleTag>
  );

  const hasSubtitle = subtitle != null && subtitle !== false;
  const hasBadges = badges != null && badges !== false;
  const subtitleRowClass =
    size === 'modal'
      ? 'inline-flex min-w-0 max-w-full items-center gap-space-2 overflow-hidden'
      : 'inline-flex min-w-0 flex-wrap items-baseline gap-space-2';

  const subtitleLine =
    hasSubtitle || hasBadges ? (
      <div className={cn(SUBTITLE_CLASS[size], size === 'modal' && 'min-w-0 overflow-hidden')}>
        <span className={subtitleRowClass}>
          {hasSubtitle ? (
            <span
              className={cn(
                size === 'modal' && 'min-w-0 max-w-full overflow-hidden',
                size === 'modal' && typeof subtitle === 'string' && 'truncate',
              )}
            >
              {subtitle}
            </span>
          ) : null}
          {hasBadges ? (
            <>
              {hasSubtitle ? (
                <span className="shrink-0 text-text-tertiary" aria-hidden="true">-</span>
              ) : null}
              <span className="inline-flex shrink-0 items-center gap-space-1">{badges}</span>
            </>
          ) : null}
        </span>
      </div>
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
            <div className={DIALOG.modalTitleFirstLine}>{titleLine}</div>
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
