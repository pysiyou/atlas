/**
 * ReportPrintButton — generate and download the lab report PDF from the list.
 */
import React from 'react';
import { actionButtonPreset, IconButton } from '@/components/primitives';
import type { ReportableOrder } from '../types';

interface ReportPrintButtonProps {
  order: ReportableOrder;
  onPrint: (order: ReportableOrder) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const ReportPrintButton: React.FC<ReportPrintButtonProps> = ({
  order,
  onPrint,
  size = 'sm',
  disabled = false,
}) => {
  return (
    <IconButton
      {...actionButtonPreset('print')}
      size={size}
      onClick={() => onPrint(order)}
      title="Print report"
      disabled={disabled}
    />
  );
};
