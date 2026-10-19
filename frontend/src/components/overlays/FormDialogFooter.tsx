/**
 * FormDialogFooter — primary submit actions for modal forms (orders, patients, etc.).
 * Dismiss via the modal header close control (no footer cancel).
 */

import React from 'react';
import { actionButtonPreset, Button } from '@/components/primitives';
import { DialogFooter } from './DialogChrome';

export interface FormDialogFooterProps {
  submitLabel: string;
  isSubmitting: boolean;
  formId: string;
  footerInfo?: React.ReactNode;
  submitVariant?: 'save' | 'primary' | 'danger';
  submitIcon?: React.ReactNode;
  /** Extra buttons rendered before submit (e.g. disable/enable). */
  leadingActions?: React.ReactNode;
  /** Hide the primary submit button (confirm-only footers). */
  hideSubmit?: boolean;
}

export const FormDialogFooter: React.FC<FormDialogFooterProps> = ({
  submitLabel,
  isSubmitting,
  formId,
  footerInfo,
  submitVariant = 'save',
  submitIcon,
  leadingActions,
  hideSubmit = false,
}) => {
  const submitPreset =
    submitVariant === 'save'
      ? actionButtonPreset('save')
      : submitVariant === 'danger'
        ? actionButtonPreset('delete')
        : { variant: 'primary' as const };

  return (
    <DialogFooter
      start={footerInfo}
      end={
        <>
          {leadingActions}
          {hideSubmit ? null : (
            <Button
              type="submit"
              {...submitPreset}
              size="md"
              layout="icon-text"
              form={formId}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              icon={submitIcon}
            >
              {submitLabel}
            </Button>
          )}
        </>
      }
    />
  );
};
