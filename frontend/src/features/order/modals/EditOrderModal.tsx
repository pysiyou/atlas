/**
 * EditOrderModal - Reusable order creation and editing modal
 *
 * Similar to EditPatientModal, this modal supports both:
 * - Creating a new order when `mode === 'create'`
 * - Editing an existing order when `mode === 'edit'` and `order` is provided
 */

import React, { useMemo } from 'react';
import type { Order } from '@/types';
import { Modal } from '@/shared/ui';
import type { BaseModalProps } from '@/shared/ui/modalRegistry';
import { CreateOrder } from '../forms/OrderCreate';
import { displayId } from '@/utils/id-display';

/**
 * Props for EditOrderModal component.
 * This modal now supports both creating a new order and editing an existing one.
 */
export interface EditOrderModalProps extends BaseModalProps {
  /** Existing order data when editing (required for edit mode) */
  order?: Order;
  /** Determines whether the modal is used for creating or editing an order */
  mode: 'create' | 'edit';
  /** Optional preselected patientId (string or number-like string) for create mode */
  patientId?: string;
}

/**
 * EditOrderModal
 *
 * Reusable order upsert modal that can:
 * - Create a new order when `mode === 'create'`
 * - Edit an existing order when `mode === 'edit'` and `order` is provided
 */
export const EditOrderModal: React.FC<EditOrderModalProps> = ({
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
      <CreateOrder
        isModal={true}
        onClose={onClose}
        initialPatientId={patientId}
        mode={mode}
        order={order}
      />
    </Modal>
  );
};
