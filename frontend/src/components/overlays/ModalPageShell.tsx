/**
 * Standard modal body layout — scroll region + optional footer (all feature modals).
 */

import type { ReactNode } from 'react';
import { ModalBodySkeleton } from '@/components/feedback/ModalBodySkeleton';
import { cn } from '@/utils';
import { FILTER } from '@/theme/recipes';

/** Default vertical rhythm for workflow / preview modal sections. */
export const MODAL_WORKFLOW_BODY_STACK = 'space-y-space-3';

export const MODAL_PAGE_BODY_PADDING = {
  default: 'p-space-6',
  filter: FILTER.modalBody,
  form: 'px-table-cell-x-default py-space-5',
  order: 'px-space-6 py-space-8',
  none: '',
} as const;

export type ModalPageBodyPadding = keyof typeof MODAL_PAGE_BODY_PADDING;

export const MODAL_PAGE_TONE = {
  /** Detail / workflow modals (matches app well). */
  page: 'bg-surface-page',
  /** Compact filter sheets. */
  panel: 'bg-surface',
} as const;

export type ModalPageTone = keyof typeof MODAL_PAGE_TONE;

export interface ModalPageShellProps {
  children?: ReactNode;
  /** When true, show a compact body skeleton and hide the footer. */
  loading?: boolean;
  /** Sticky footer (DialogFooter, FilterModalFooter, FormDialogFooter, etc.). */
  footer?: ReactNode;
  tone?: ModalPageTone;
  bodyPadding?: ModalPageBodyPadding;
  /** Extra classes on the scrollable body (e.g. section stack spacing). */
  bodyClassName?: string;
  /** Content above children inside the scroll area (lab modal headers). */
  beforeBody?: ReactNode;
}

export function ModalPageShell({
  children,
  loading = false,
  footer,
  tone = 'page',
  bodyPadding = 'default',
  bodyClassName,
  beforeBody,
}: ModalPageShellProps) {
  const paddingClass = MODAL_PAGE_BODY_PADDING[bodyPadding];

  return (
    <div className={cn('flex h-full min-h-0 flex-col', MODAL_PAGE_TONE[tone])}>
      <div className={cn('min-h-0 flex-1 overflow-y-auto', paddingClass, bodyClassName)}>
        {beforeBody}
        {loading ? <ModalBodySkeleton /> : children}
      </div>
      {loading ? null : footer}
    </div>
  );
}
