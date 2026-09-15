import React from 'react';
import { Button, DialogFooter } from '@/components';

export interface OrderModalFooterProps {
  onClose: () => void;
  submitLabel: string;
  isSubmitting: boolean;
  formId: string;
  footerInfo?: React.ReactNode;
  buttonVariant?: 'save' | 'primary';
  buttonIcon?: React.ReactNode;
}

export const OrderModalFooter: React.FC<OrderModalFooterProps> = ({
  onClose,
  submitLabel,
  isSubmitting,
  formId,
  footerInfo,
  buttonVariant = 'save',
  buttonIcon,
}) => (
  <DialogFooter
    start={footerInfo}
    end={
      <>
        <Button
          type="button"
          variant="cancel"
          size="md"
          layout="icon-text"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant={buttonVariant}
          size="md"
          layout="icon-text"
          form={formId}
          isLoading={isSubmitting}
          disabled={isSubmitting}
          icon={buttonIcon}
        >
          {submitLabel}
        </Button>
      </>
    }
  />
);
