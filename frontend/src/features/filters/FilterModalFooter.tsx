/**
 * FilterModalFooter - Reset and apply actions for responsive filter modals.
 */

import React from 'react';
import { Button, FooterInfo } from '@/components';
import { ICONS } from '@/utils';

export interface FilterModalFooterProps {
  onReset: () => void;
  onApply: () => void;
}

export const FilterModalFooter: React.FC<FilterModalFooterProps> = ({ onReset, onApply }) => (
  <div className="px-5 py-4 border-t border-border-default bg-surface shrink-0">
    <div className="flex items-center justify-between gap-3">
      <FooterInfo icon={ICONS.actions.filter} text="Filtering results" />
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
