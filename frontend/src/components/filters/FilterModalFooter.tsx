/**
 * FilterModalFooter - Reset and apply actions for responsive filter modals.
 */

import { FooterInfo } from '@/components/display';

import { DialogFooter } from '@/components/overlays';
import { Button } from '@/components/primitives';
import type { IconKey } from '@/icons';

export interface FilterModalFooterProps {
  onReset: () => void;
  onApply: () => void;
  /** Module icon shown in the footer */
  icon: IconKey;
  /** Screen-reader label for the footer icon */
  label?: string;
}

export function FilterModalFooter({
  onReset,
  onApply,
  icon,
  label,
}: FilterModalFooterProps) { return (
  <DialogFooter
    start={<FooterInfo icon={icon} label={label} size="md" />}
    end={
      <>
        <Button variant="outline" size="sm" layout="text" onClick={onReset}>
          Reset
        </Button>
        <Button variant="primary" size="sm" layout="text" onClick={onApply}>
          Filter
        </Button>
      </>
    }
  />
); }
