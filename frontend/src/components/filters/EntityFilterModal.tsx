/**
 * Generic modal shell for entity list filters on small screens.
 */

import React, { type ReactNode } from 'react';
import { Modal, ModalPageShell, OverlaySearchInput } from '@/components';
import type { IconName } from '@/components';
import { FilterModalFooter } from './FilterModalFooter';

export interface EntityFilterModalProps {
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

export const EntityFilterModal: React.FC<EntityFilterModalProps> = ({
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
