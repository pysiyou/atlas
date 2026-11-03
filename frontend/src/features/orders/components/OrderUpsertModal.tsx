/**
 * OrderUpsertModal
 *
 * Modal for creating a new order or editing an existing one.
 * Logic lives in useOrderUpsertModal; this component is presentational.
 */

import React from 'react';
import { text } from '@/theme/recipes';
import { FormDialogFooter, Modal, ModalPageShell } from '@/components/overlays';
import { FooterInfo } from '@/components/display';
import { Icon, actionButtonPreset, Button } from '@/components/primitives';
import { IconKeys } from '@/config/icons';
import { formatCurrency } from '@/utils';
import { useOrderUpsertModal } from '../hooks/useOrderUpsertModal';
import { OrderUpsertFormFields } from './OrderUpsertFormFields';
import { useClientListChrome } from '@/hooks';
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
    isOrderError,
    orderError,
    refetchOrder,
    order: resolvedOrder,
  } = modalState;

  const waitingOnOrder = mode === 'edit' && isOrderLoading && !resolvedOrder;
  const orderLoadFailed = mode === 'edit' && isOrderError && !resolvedOrder && !isOrderLoading;
  useClientListChrome({
    loadFailedKey: 'orders.list.loadFailed',
    isLoading: false,
    isError: mode === 'edit' && isOrderError && !resolvedOrder,
    error: orderError,
    refetch: refetchOrder,
  });

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
        loading={waitingOnOrder}
        footer={
            <FormDialogFooter
              submitLabel={submitLabel}
              isSubmitting={isSubmitting || isProcessingPayment}
              formId="order-form"
              submitVariant={paymentMethod && mode === 'create' ? 'primary' : 'save'}
              submitIcon={
                paymentMethod && mode === 'create' && !isSubmitting && !isProcessingPayment ? (
                  <Icon iconKey={IconKeys.dataFields.wallet} />
                ) : undefined
              }
              footerInfo={
                mode === 'edit' && resolvedOrder ? (
                  <FooterInfo icon={IconKeys.modules.orders} label="Orders" size="md" />
                ) : (
                  <div className={`${text({ role: 'body' })} text-brand`}>
                    Total: {formatCurrency(totalPrice)}
                  </div>
                )
              }
            />
        }
      >
        {orderLoadFailed ? (
          <div className="flex justify-center p-panel">
            <Button {...actionButtonPreset('retry')} size="sm" onClick={() => void refetchOrder()}>
              Retry
            </Button>
          </div>
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
