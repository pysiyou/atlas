/**
 * ReportPreviewButton Component
 * Reusable button for previewing and generating reports
 *
 * Shows an eye icon button that opens the preview modal
 */
import React from 'react';
import { IconButton } from '@/shared/ui';
import type { ValidatedTest } from '../types';

interface ReportPreviewButtonProps {
  /** Validated test to preview report for */
  test: ValidatedTest;
  /** Callback invoked when preview is clicked */
  onPreview: (test: ValidatedTest) => void;
  /** Button size */
  size?: 'xs' | 'sm' | 'md';
}

/**
 * ReportPreviewButton - Displays preview action for validated tests
 *
 * Shows an icon button to preview the report before generating PDF
 */
export const ReportPreviewButton: React.FC<ReportPreviewButtonProps> = ({
  test,
  onPreview,
  size = 'sm',
}) => {
  return (
    <IconButton 
      variant="view" 
      size={size} 
      onClick={() => onPreview(test)}
      className="bg-action-primary text-text-inverse hover:opacity-90"
    />
  );
};
