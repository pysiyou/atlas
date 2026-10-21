/**
 * Modal shell for list-page filters on small screens.
 */

import React, { type ReactNode } from 'react';
import { Modal, ModalPageShell, OverlaySearchInput } from '@/components/overlays';
import type { IconName } from '@/components/primitives';
import { FilterModalFooter } from './FilterModalFooter';

export interface ListFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  onReset: () => void;
  footerIcon: IconName;
  footerLabel?: string;
  children: ReactNode;
}

export const ListFilterModal: React.FC<ListFilterModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  onReset,
  footerIcon,
  footerLabel,
  children,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Filter" size="md">
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
);
