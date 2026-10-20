/**
 * OrderUpsertModal
 *
 * Modal for creating a new order or editing an existing one.
 * Logic lives in useOrderUpsertModal; this component is presentational.
 */

import React from 'react';
import { TYPE } from '@/components/theme/recipes';
import { FormDialogFooter, Modal, ModalPageShell } from '@/components/overlays';
import { FooterInfo } from '@/components/display';
import { Icon } from '@/components/primitives';
import { MODULE_ICONS } from '@/config/icons';
import { formatCurrency } from '@/utils';
import { ICONS } from '@/config/icons';
import { useOrderUpsertModal } from '../hooks/useOrderUpsertModal';
import { OrderUpsertFormFields } from './OrderUpsertFormFields';
import { DetailPageSkeleton } from '@/components/loaders/DetailPageSkeleton';
import type { OrderUpsertModalOpenProps } from '@/lib/context/modalTypes';

export type OrderUpsertModalProps = OrderUpsertModalOpenProps;

export const OrderUpsertModal: React.FC<OrderUpsertModalProps> = ({
  isOpen,
  onClose,
  isActive = true,
  orderId,
  mode: modeProp,
  patientId,
}) => {
  const mode = modeProp ?? (orderId != null ? 'edit' : 'create');
  const modalState = useOrderUpsertModal({
    isOpen,
    orderId,
    mode,
    patientId,
    onClose,
  });
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
    isOrderLoading,
    order: resolvedOrder,
  } = modalState;

  const waitingOnOrder = mode === 'edit' && isOrderLoading && !resolvedOrder;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      subtitle={subtitle}
      size="2xl"
      disableClose={isSubmitting || isProcessingPayment}
      isActive={isActive}
    >
      <ModalPageShell
        bodyPadding="order"
        footer={
          waitingOnOrder ? undefined : (
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
                mode === 'edit' && resolvedOrder ? (
                  <FooterInfo icon={MODULE_ICONS.orders} label="Orders" size="md" />
                ) : (
                  <div className={`${TYPE.value} text-brand`}>
                    Total: {formatCurrency(totalPrice)}
                  </div>
                )
              }
            />
          )
        }
      >
        {waitingOnOrder ? (
          <DetailPageSkeleton variant="responsive-detail" />
        ) : (
          <form id="order-form" onSubmit={handleSubmit} className="max-w-full">
            <OrderUpsertFormFields
              control={control}
              mode={mode}
              patientId={patientId}
              modalState={modalState}
            />
          </form>
        )}
      </ModalPageShell>
    </Modal>
  );
};
