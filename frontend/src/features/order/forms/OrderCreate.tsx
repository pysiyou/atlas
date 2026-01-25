import { OrderCreateLayout } from './OrderCreateLayout';
import React from 'react';
import { useOrderController } from '../hooks/useOrderController';
import type { Order } from '@/types';

/**
 * CreateOrder
 *
 * Order creation/editing screen for `/orders/new` or modal.
 * Styled to match the patient form layout conventions:
 * - Slate background content area
 * - Padded, scrollable main region
 * - Max-width centered form container
 * - Sticky footer action bar
 */
export interface CreateOrderProps {
  /**
   * When true, the form is rendered inside a modal.
   * - Cancel should close the modal instead of navigating.
   * - We avoid duplicating the "New Order" page title (the modal already has one).
   */
  isModal?: boolean;
  /** Close handler used when `isModal` is true. */
  onClose?: () => void;
  /** Optional patient ID to preselect (overrides URL search param when provided). */
  initialPatientId?: string;
  /** Mode: 'create' for new orders, 'edit' for existing orders */
  mode?: 'create' | 'edit';
  /** Existing order data when editing */
  order?: Order;
}

export const CreateOrder: React.FC<CreateOrderProps> = ({
  isModal = false,
  onClose,
  initialPatientId,
  mode = 'create',
  order,
}) => {
  const c = useOrderController({ isModal, onClose, initialPatientId, mode, existingOrder: order });

  return (
    <OrderCreateLayout
      isModal={isModal}
      isLoading={c.isLoading}
      headerSubtitle={c.headerSubtitle}
      onCancel={c.handleCancel}
      onSubmit={c.handleSubmit}
      isSubmitting={c.isSubmitting}
      selectedPatient={c.selectedPatient}
      patientSearch={c.patientSearch}
      onPatientSearchChange={c.setPatientSearch}
      filteredPatients={c.filteredPatients}
      onSelectPatient={c.selectPatient}
      onClearPatient={c.clearPatient}
      patientError={c.patientError}
      selectedTests={c.selectedTests}
      testSearch={c.testSearch}
      onTestSearchChange={c.setTestSearch}
      filteredTests={c.filteredTests}
      onToggleTest={c.toggleTest}
      testsError={c.testsError}
      paymentMethods={c.paymentMethods}
      paymentMethod={c.paymentMethod}
      onPaymentMethodChange={c.setPaymentMethod}
      paymentNotes={c.paymentNotes}
      onPaymentNotesChange={c.setPaymentNotes}
      paymentError={c.paymentError}
      totalPrice={c.totalPrice}
      referringPhysician={c.referringPhysician}
      priority={c.priority}
      clinicalNotes={c.clinicalNotes}
      onReferringPhysicianChange={c.setReferringPhysician}
      onPriorityChange={c.setPriority}
      onClinicalNotesChange={c.setClinicalNotes}
      mode={mode}
      patientReadOnly={c.patientReadOnly}
    />
  );
};
