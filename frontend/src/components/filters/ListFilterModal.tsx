/**
 * Modal shell for list-page filters on small screens.
 */

import { type ReactNode } from 'react';
import { Modal, ModalPageShell, OverlaySearchInput } from '@/components/overlays';
import type { IconKey } from '@/icons';
import { FilterModalFooter } from './FilterModalFooter';
import { usePanelCopy } from '@/strings';

export interface ListFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  onReset: () => void;
  footerIcon: IconKey;
  footerLabel?: string;
  children: ReactNode;
}

export function ListFilterModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  onReset,
  footerIcon,
  footerLabel,
  children,
}: ListFilterModalProps) {
  const panels = usePanelCopy();
  return (
  <Modal isOpen={isOpen} onClose={onClose} title={panels.shared.filter} size="md">
    <ModalPageShell
      tone="panel"
      bodyPadding="filter"
      footer={
        <FilterModalFooter
          onReset={onReset}
          onApply={onClose}
          icon={footerIcon}
          label={footerLabel}
        />
      }
    >
      <div className="mb-space-6">
        <OverlaySearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
      </div>
      <div className="space-y-space-5">{children}</div>
    </ModalPageShell>
  </Modal>
); }
