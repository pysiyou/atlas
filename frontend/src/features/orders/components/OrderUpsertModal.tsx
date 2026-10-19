/**
 * OrderUpsertModal
 *
 * Modal for creating a new order or editing an existing one.
 * Logic lives in useOrderUpsertModal; this component is presentational.
 */

import React from 'react';
import { TYPE } from '@/components/theme/recipes';
import type { Order } from '@/types';
import { Modal, FormDialogFooter } from '@/components/overlays';
import { FooterInfo } from '@/components/display';
import { Icon } from '@/components/primitives';
import { MODULE_ICONS } from '@/config/icons';
import { formatCurrency } from '@/utils';
import { ICONS } from '@/config/icons';
import { useOrderUpsertModal } from '../hooks/useOrderUpsertModal';
import { OrderUpsertFormFields } from './OrderUpsertFormFields';
import type { BaseModalProps } from '@/lib/context/modalTypes';

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
        <div className="flex-1 overflow-y-auto px-space-6 py-space-8">
          <form id="order-form" onSubmit={handleSubmit} className="max-w-full">
            <OrderUpsertFormFields
              control={control}
              mode={mode}
              patientId={patientId}
              modalState={modalState}
            />
          </form>
        </div>
        <FormDialogFooter
          submitLabel={submitLabel}
          isSubmitting={isSubmitting || isProcessingPayment}
          formId="order-form"
          submitVariant={paymentMethod && mode === 'create' ? 'primary' : 'save'}
          submitIcon={
            paymentMethod && mode === 'create' && !isSubmitting && !isProcessingPayment ? (
              <Icon name={ICONS.dataFields.wallet} />
            ) : undefined
          }
          footerInfo={
            mode === 'edit' && order ? (
              <FooterInfo icon={MODULE_ICONS.orders} label="Orders" size="md" />
            ) : (
              <div className={`${TYPE.value} text-brand`}>
                Total: {formatCurrency(totalPrice)}
              </div>
            )
          }
        />
      </div>
    </Modal>
  );
};
