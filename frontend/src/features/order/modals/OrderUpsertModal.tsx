/**
 * OrderUpsertModal
 *
 * Modal for creating a new order or editing an existing one.
 * - Create: mode === 'create', optional patientId to preselect.
 * - Edit: mode === 'edit', order required.
 */

import React, { useMemo } from 'react';
import type { Order } from '@/types';
import { Modal } from '@/shared/ui';
import type { BaseModalProps } from '@/shared/ui/modalRegistry';
import { OrderUpsertForm } from '../forms/OrderUpsertForm';
import { displayId } from '@/utils/id-display';

export interface OrderUpsertModalProps extends BaseModalProps {
  /** Existing order when editing. */
  order?: Order;
  /** 'create' | 'edit' */
  mode: 'create' | 'edit';
  /** Preselected patient ID for create mode. */
  patientId?: string;
}

export const OrderUpsertModal: React.FC<OrderUpsertModalProps> = ({
  isOpen,
  onClose,
  order,
  mode,
  patientId,
}) => {
  const modalTitle = mode === 'edit' ? 'Edit Order' : 'New Order';
  const subtitle = useMemo(() => {
    if (mode === 'edit' && order) {
      return `Editing order ${displayId.order(order.orderId)}`;
    }
    if (patientId) {
      return `Creating an order for patient ${patientId}.`;
    }
    return 'Select a patient and choose tests to create a new order.';
  }, [mode, order, patientId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} subtitle={subtitle} size="2xl">
      <OrderUpsertForm
        isModal={true}
        onClose={onClose}
        initialPatientId={patientId}
        mode={mode}
        order={order}
      />
    </Modal>
  );
};
