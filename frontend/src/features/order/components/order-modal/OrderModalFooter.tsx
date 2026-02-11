import React from 'react';
import { Button } from '@/shared/ui';

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
  <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border-default bg-surface shrink-0 shadow-[var(--shadow-footer)]">
    {footerInfo}
    <div className="flex items-center gap-3">
      <Button type="button" variant="cancel" showIcon={true} onClick={onClose}>
        Cancel
      </Button>
      <Button
        type="submit"
        variant={buttonVariant}
        form={formId}
        isLoading={isSubmitting}
        disabled={isSubmitting}
        icon={buttonIcon}
      >
        {submitLabel}
      </Button>
    </div>
  </div>
);
