/**
 * FilterModalFooter - Reset and apply actions for responsive filter modals.
 */

import React from 'react';
import { Button, FooterInfo } from '@/components';
import type { IconName } from '@/components';

export interface FilterModalFooterProps {
  onReset: () => void;
  onApply: () => void;
  /** Module icon shown in the footer */
  icon: IconName;
  /** Screen-reader label for the footer icon */
  label?: string;
}

export const FilterModalFooter: React.FC<FilterModalFooterProps> = ({
  onReset,
  onApply,
  icon,
  label,
}) => (
  <div className="px-5 py-4 border-t border-border-default bg-surface shrink-0">
    <div className="flex items-center justify-between gap-3">
      <FooterInfo icon={icon} label={label} size="md" />
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onReset} showIcon={false}>
          Reset
        </Button>
        <Button variant="primary" onClick={onApply} showIcon={false}>
          Filter
        </Button>
      </div>
    </div>
  </div>
);
