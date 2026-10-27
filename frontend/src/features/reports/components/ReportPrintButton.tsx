/**
 * ReportPrintButton — generate and download the lab report PDF from the list.
 */
import React from 'react';
import { actionButtonPreset, IconButton } from '@/components/primitives';
import type { ReportableOrder } from '../types';
import { canPrintReport } from '../utils/reportEligibility';

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
  const printable = canPrintReport(order);
  const isDisabled = disabled || !printable;

  return (
    <IconButton
      {...actionButtonPreset('print')}
      variant="primary"
      size={size}
      onClick={() => onPrint(order)}
      title={printable ? 'Print report' : 'Print available when order is completed'}
      disabled={isDisabled}
    />
  );
};
