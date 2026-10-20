/**
 * FilterModalFooter - Reset and apply actions for responsive filter modals.
 */

import React from 'react';
import { FooterInfo } from '@/components/display';
import { DialogFooter } from '@/components/overlays';
import { Button, type IconName } from '@/components/primitives';

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
  <DialogFooter
    start={<FooterInfo icon={icon} label={label} size="md" />}
    end={
      <>
        <Button variant="outline" size="md" layout="text" onClick={onReset}>
          Reset
        </Button>
        <Button variant="primary" size="md" layout="text" onClick={onApply}>
          Filter
        </Button>
      </>
    }
  />
);
