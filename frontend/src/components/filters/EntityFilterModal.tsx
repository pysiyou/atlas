/**
 * Generic modal shell for entity list filters on small screens.
 */

import React, { type ReactNode } from 'react';
import { Modal, OverlaySearchInput } from '@/components';
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
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="mb-6">
          <OverlaySearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        </div>
        <div className="space-y-5">{children}</div>
      </div>
      <FilterModalFooter
        onReset={onReset}
        onApply={onClose}
        icon={footerIcon}
        label={footerLabel}
      />
    </div>
  </Modal>
);
