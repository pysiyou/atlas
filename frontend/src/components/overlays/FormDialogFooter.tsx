/**
 * FormDialogFooter — cancel + submit actions for modal forms (orders, patients, etc.).
 */

import React from 'react';
import { actionButtonPreset, Button } from '@/components/primitives';
import { DialogFooter } from './DialogChrome';

export interface FormDialogFooterProps {
  onClose: () => void;
  submitLabel: string;
  isSubmitting: boolean;
  formId: string;
  footerInfo?: React.ReactNode;
  submitVariant?: 'save' | 'primary' | 'danger';
  submitIcon?: React.ReactNode;
  /** Extra buttons rendered before Cancel (e.g. disable/enable). */
  leadingActions?: React.ReactNode;
  /** Hide the primary submit button (confirm-only footers). */
  hideSubmit?: boolean;
  cancelLabel?: string;
}

export const FormDialogFooter: React.FC<FormDialogFooterProps> = ({
  onClose,
  submitLabel,
  isSubmitting,
  formId,
  footerInfo,
  submitVariant = 'save',
  submitIcon,
  leadingActions,
  hideSubmit = false,
  cancelLabel = 'Cancel',
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
          <Button
            type="button"
            {...actionButtonPreset('cancel')}
            size="md"
            layout="icon-text"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
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
