import { useState, type ReactNode } from 'react';
import { actionButtonPreset, Badge, Button } from '@/components/primitives';
import { Modal, ModalPageShell } from '@/components/overlays';
import { FilterModalFooter } from '@/components/filters/FilterModalFooter';
import { FILTER } from '@/theme/recipes';
import { cn } from '@/utils';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import type { IconName } from '@/components/primitives';

export interface ResponsiveFilterInsetBarProps {
  activeFilterCount: number;
  inlineControls: ReactNode;
  modalExtras?: ReactNode;
  modalTitle: string;
  onReset: () => void;
  modalFooterIcon: IconName;
  modalFooterLabel: string;
  /** Extra sections rendered inside the mobile filter modal (date, kind, etc.). */
  modalSections?: ReactNode;
}

/**
 * Shared responsive filter chrome: mobile modal trigger, md two-column inset, desktop grid.
 * Used by audit event log and lab queue filter rows.
 */
export function ResponsiveFilterInsetBar({
  activeFilterCount,
  inlineControls,
  modalExtras,
  modalTitle,
  onReset,
  modalFooterIcon,
  modalFooterLabel,
  modalSections,
}: ResponsiveFilterInsetBarProps) {
  const breakpoint = useBreakpoint();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModalView = isBreakpointAtMost(breakpoint, 'sm');
  const showTwoColumn = breakpoint === 'md';

  if (showModalView) {
    return (
      <>
        <div className="w-full border-b border-border-default bg-surface">
          <div className="flex items-center justify-end gap-space-2 px-space-3 py-space-2">
            <div className="relative flex shrink-0">
              <Button {...actionButtonPreset('filter')} size="sm" onClick={() => setIsModalOpen(true)}>
                Filters
              </Button>
              {activeFilterCount > 0 && (
                <Badge
                  variant="primary"
                  size="xs"
                  className="absolute -top-space-1 -right-space-1 flex h-4 min-w-[18px] items-center justify-center px-space-1"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle} size="md">
          <ModalPageShell
            tone="panel"
            bodyPadding="filter"
            bodyClassName="space-y-space-5"
            footer={
              <FilterModalFooter
                onReset={onReset}
                onApply={() => setIsModalOpen(false)}
                icon={modalFooterIcon}
                label={modalFooterLabel}
              />
            }
          >
            {modalExtras}
            {modalSections}
          </ModalPageShell>
        </Modal>
      </>
    );
  }

  if (showTwoColumn) {
    return (
      <div className={cn('w-full border-b border-border-default bg-surface')}>
        <div className={FILTER.barInsetCompact}>
          <div className={FILTER.mobileTwoCol}>{inlineControls}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border-b border-border-default bg-surface">
      <div className={FILTER.barInset}>
        <div className={FILTER.barGridDesktop}>{inlineControls}</div>
      </div>
    </div>
  );
}
