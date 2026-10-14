/**
 * ReportPreviewButton Component
 * Reusable button for previewing and generating reports
 *
 * Shows an eye icon button that opens the preview modal
 */
import React from 'react';
import { actionButtonPreset, IconButton } from '@/components/primitives';
import type { ReportableOrder } from '../types';

interface ReportPreviewButtonProps {
  /** Reportable order to preview the report for */
  order: ReportableOrder;
  /** Callback invoked when preview is clicked */
  onPreview: (order: ReportableOrder) => void;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * ReportPreviewButton - Displays preview action for reportable orders
 */
export const ReportPreviewButton: React.FC<ReportPreviewButtonProps> = ({
  order,
  onPreview,
  size = 'sm',
}) => {
  return (
    <IconButton
      {...actionButtonPreset('view')}
      size={size}
      onClick={() => onPreview(order)}
      title="Preview report"
    />
  );
};
