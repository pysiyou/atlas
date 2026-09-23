/**
 * ReportPreviewButton Component
 * Reusable button for previewing and generating reports
 *
 * Shows an eye icon button that opens the preview modal
 */
import React from 'react';
import { actionButtonPreset, IconButton } from '@/components';
import type { ValidatedTest } from '../types';

interface ReportPreviewButtonProps {
  /** Validated test to preview report for */
  test: ValidatedTest;
  /** Callback invoked when preview is clicked */
  onPreview: (test: ValidatedTest) => void;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * ReportPreviewButton - Displays preview action for validated tests
 */
export const ReportPreviewButton: React.FC<ReportPreviewButtonProps> = ({
  test,
  onPreview,
  size = 'sm',
}) => {
  return (
    <IconButton
      {...actionButtonPreset('view')}
      size={size}
      onClick={() => onPreview(test)}
      title="Preview report"
    />
  );
};
