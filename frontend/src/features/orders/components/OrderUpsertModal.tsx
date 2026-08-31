/**
 * OrderUpsertModal
 *
 * Modal for creating a new order or editing an existing one.
 * Logic lives in useOrderUpsertModal; this component is presentational.
 */

import React from 'react';
import type { Order } from '@/types';
import { Modal, FooterInfo, Icon } from '@/components';
import { displayId, formatCurrency } from '@/utils';
import { ICONS } from '@/config/icons';
import { useOrderUpsertModal } from '../hooks/useOrderUpsertModal';
import { OrderModalFooter } from './OrderModalFooter';
import { OrderUpsertFormFields } from './OrderUpsertFormFields';
import type { BaseModalProps } from '@/components';

export interface OrderUpsertModalProps extends BaseModalProps {
  order?: Order;
  mode: 'create' | 'edit';
  patientId?: string;
}

export const OrderUpsertModal: React.FC<OrderUpsertModalProps> = ({
  isOpen,
  onClose,
  order,
  mode,
  patientId,
}) => {
  const modalState = useOrderUpsertModal({ isOpen, order, mode, patientId, onClose });
  const {
    control,
    handleSubmit,
    isSubmitting,
    isProcessingPayment,
    paymentMethod,
    modalTitle,
    subtitle,
    submitLabel,
    handleClose,
    totalPrice,
  } = modalState;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      subtitle={subtitle}
      size="2xl"
      disableClose={isSubmitting || isProcessingPayment}
    >
      <div className="flex flex-col h-full bg-surface-page">
        <form id="order-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <OrderUpsertFormFields
            control={control}
            mode={mode}
            patientId={patientId}
            modalState={modalState}
          />

          <OrderModalFooter
            onClose={onClose}
            submitLabel={submitLabel}
            isSubmitting={isSubmitting || isProcessingPayment}
            formId="order-form"
            buttonVariant={paymentMethod && mode === 'create' ? 'primary' : 'save'}
            buttonIcon={
              paymentMethod && mode === 'create' && !isSubmitting && !isProcessingPayment ? (
                <Icon name={ICONS.dataFields.wallet} />
              ) : undefined
            }
            footerInfo={
              mode === 'edit' && order ? (
                <FooterInfo
                  icon={ICONS.dataFields.document}
                  text={`Editing ${displayId.order(order.orderId)}`}
                />
              ) : (
                <div className="text-base font-normal text-brand">
                  Total: {formatCurrency(totalPrice)}
                </div>
              )
            }
          />
        </form>
      </div>
    </Modal>
  );
};
