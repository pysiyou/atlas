import React from 'react';
import { FORM_FIELD_LABEL } from '@/components/inputs/inputStyles';
import { RADIUS, TYPE } from '@/components/theme/recipes';


const POPOVER_SHELL_CLASS = [
  'absolute left-0 right-0 top-full z-50 mt-space-1 text-text-primary',
  'border border-border-default/80',
  RADIUS.menu,
  'overflow-hidden',
  'bg-surface',
  'shadow-md',
  'ring-1 ring-black/5',
].join(' ');

export interface OrderSelectPopoverShellProps {
  title: string;
  resultCount: number;
  emptyMessage: string;
  isEmpty: boolean;
  children: React.ReactNode;
}

/** Shared results panel for patient and test search in order upsert. */
export const OrderSelectPopoverShell: React.FC<OrderSelectPopoverShellProps> = ({
  title,
  resultCount,
  emptyMessage,
  isEmpty,
  children,
}) => (
  <div className={POPOVER_SHELL_CLASS}>
    <div className="px-space-4 py-space-2-5 bg-surface-page/70 border-b border-border-default/70 flex items-center justify-between">
      <div className={FORM_FIELD_LABEL}>{title}</div>
      <div className={TYPE.meta}>{resultCount} result(s)</div>
    </div>

    {isEmpty ? (
      <div className={`px-space-4 py-space-3 ${TYPE.meta}`}>{emptyMessage}</div>
    ) : (
      <div className="max-h-[280px] overflow-y-auto divide-y divide-border-default/70">
        {children}
      </div>
    )}
  </div>
);
