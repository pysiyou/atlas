/**
 * OrderCreateModal
 *
 * Wraps the `CreateOrder` flow inside the shared `Modal` component so "New Order"
 * can be launched as a modal from anywhere (patients list, patient detail, orders list).
 *
 * Notes:
 * - `CreateOrder` handles actual creation + navigation to the created order.
 * - This modal is responsible for sizing and close behavior only.
 */
import React, { useMemo } from 'react';
import { Modal } from '@/shared/ui';
import type { BaseModalProps } from '@/shared/ui/modalRegistry';
import { CreateOrder } from './OrderCreate';

export interface OrderCreateModalProps extends BaseModalProps {
  /** Optional preselected patientId (string or number-like string) */
  patientId?: string;
}

export const OrderCreateModal: React.FC<OrderCreateModalProps> = ({ isOpen, onClose, patientId }) => {
  const subtitle = useMemo(() => {
    if (!patientId) return 'Select a patient and choose tests to create a new order.';
    return `Creating an order for patient ${patientId}.`;
  }, [patientId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Order" subtitle={subtitle} size="5xl">
      <CreateOrder isModal={true} onClose={onClose} initialPatientId={patientId} />
    </Modal>
  );
};

