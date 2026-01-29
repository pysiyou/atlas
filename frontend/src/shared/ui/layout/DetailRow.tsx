/**
 * DetailRow – single label/value row with shared typography tokens.
 * Use for detail views; DetailsTable can map rows to DetailRow.
 */

import React from 'react';
import { DETAIL_LABEL, DETAIL_VALUE } from '@/shared/constants';

export interface DetailRowProps {
  /** Field label */
  label: string;
  /** Field value */
  value: React.ReactNode;
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Additional CSS classes */
  className?: string;
}

export const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  orientation = 'horizontal',
  className = '',
}) => {
  if (orientation === 'vertical') {
    return (
      <div className={`flex flex-col gap-0.5 ${className}`}>
        <span className={DETAIL_LABEL}>{label}</span>
        <span className={DETAIL_VALUE}>{value}</span>
      </div>
    );
  }
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <span className={DETAIL_LABEL}>{label}</span>
      <span className={DETAIL_VALUE}>{value}</span>
    </div>
  );
};
