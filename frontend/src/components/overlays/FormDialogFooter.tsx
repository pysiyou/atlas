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
  submitVariant?: 'save' | 'primary';
  submitIcon?: React.ReactNode;
}

export const FormDialogFooter: React.FC<FormDialogFooterProps> = ({
  onClose,
  submitLabel,
  isSubmitting,
  formId,
  footerInfo,
  submitVariant = 'save',
  submitIcon,
}) => {
  const submitPreset =
    submitVariant === 'save' ? actionButtonPreset('save') : { variant: 'primary' as const };

  return (
    <DialogFooter
      start={footerInfo}
      end={
        <>
          <Button
            type="button"
            {...actionButtonPreset('cancel')}
            size="md"
            layout="icon-text"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
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
        </>
      }
    />
  );
};
