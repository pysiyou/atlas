/**
 * PartialValidationIndicator - Orders with some tests validated, some pending (lock icon).
 */

import React from 'react';
import { Icon } from '@/shared/ui';
import { ICONS } from '@/utils';

export interface PartialValidationIndicatorProps {
  count: number;
}

export const PartialValidationIndicator: React.FC<PartialValidationIndicatorProps> = ({
  count,
}) => {
  if (count === 0) return null;
  return (
    <div className="mt-3 flex items-center gap-2 text-xs text-feedback-warning-text">
      <Icon name={ICONS.ui.lock} className="w-4 h-4 flex-shrink-0" />
      <span>{count} order(s) partially validated</span>
    </div>
  );
}
