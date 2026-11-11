/**
 * ReportRowActionsMenu — row overflow menu (print and future report actions).
 */
import React from 'react';
import { Popover } from '@/components/overlays';
import { actionButtonPreset, Icon, IconButton } from '@/components/primitives';
import { IconKeys } from '@/config/icons';
import { cn } from '@/utils';
import { CONTROL, MENU_ITEM_TYPE, RADIUS, text } from '@/theme/recipes';
import type { ReportableOrder } from '../types';
import { canPrintReport } from '../utils/reportEligibility';

export interface ReportRowActionsMenuProps {
  order: ReportableOrder;
  onPrint: (order: ReportableOrder) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ReportRowActionsMenu: React.FC<ReportRowActionsMenuProps> = ({
  order,
  onPrint,
  disabled = false,
  size = 'sm',
}) => {
  const printable = canPrintReport(order);
  const printDisabled = disabled || !printable;
  const printHint = printable ? 'Print report' : 'Print available when order is completed';

  return (
    <Popover
      placement="bottom-end"
      offsetValue={8}
      viewportPadding={8}
      showBackdrop={false}
      className="w-48 min-w-0"
      trigger={({ isOpen }) => (
        <IconButton
          {...actionButtonPreset('menu')}
          variant="primary"
          size={size}
          title="Actions"
          aria-label="Report actions"
          aria-expanded={isOpen}
          aria-haspopup="menu"
        />
      )}
    >
      {({ close }) => (
        <div className="flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-space-3 border-b border-border-default bg-surface-page px-space-3 py-space-3">
            <p className={`${text({ role: 'title-section' })} min-w-0 flex-1 truncate`}>Actions</p>
          </div>
          <div className="p-space-1-5" role="menu" aria-label="Report actions">
            <button
              type="button"
              role="menuitem"
              disabled={printDisabled}
              title={printHint}
              className={cn(
                `flex w-full items-center gap-space-2-5 px-space-2-5 py-space-2 text-left ${MENU_ITEM_TYPE}`,
                RADIUS.menuItem,
                printDisabled
                  ? cn('cursor-not-allowed opacity-60', text({ role: 'body', intent: 'muted' }))
                  : cn(
                      'cursor-pointer hover:bg-surface-hover transition-colors duration-150',
                      text({ role: 'body' }),
                      CONTROL.focusVisible,
                    ),
              )}
              onClick={() => {
                if (printDisabled) return;
                close();
                onPrint(order);
              }}
            >
              <Icon iconKey={IconKeys.actions.printer} className="size-4 shrink-0" />
              <span className="truncate">Print</span>
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
};
