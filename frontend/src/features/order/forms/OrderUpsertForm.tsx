/**
 * OrderUpsertForm
 *
 * Order create/edit form used on `/orders/new` and in the order upsert modal.
 * Layout: slate background, scrollable main region, max-width form, sticky footer.
 */

import React from 'react';
import { useOrderController } from '../hooks/useOrderController';
import type { Order } from '@/types';
import { OrderUpsertLayout } from './OrderUpsertLayout';

export interface OrderUpsertFormProps {
  /** When true, form is in a modal; cancel closes modal, no page title. */
  isModal?: boolean;
  /** Close handler when `isModal` is true. */
  onClose?: () => void;
  /** Optional patient ID to preselect (overrides URL ?patientId). */
  initialPatientId?: string;
  /** 'create' | 'edit' */
  mode?: 'create' | 'edit';
  /** Existing order when editing. */
  order?: Order;
}

export const OrderUpsertForm: React.FC<OrderUpsertFormProps> = ({
  isModal = false,
  onClose,
  initialPatientId,
  mode = 'create',
  order,
}) => {
  const c = useOrderController({ isModal, onClose, initialPatientId, mode, existingOrder: order });

  const patientProps = {
    selectedPatient: c.selectedPatient,
    patientSearch: c.patientSearch,
    onPatientSearchChange: c.setPatientSearch,
    filteredPatients: c.filteredPatients,
    onSelectPatient: c.selectPatient,
    onClearPatient: c.clearPatient,
    patientError: c.patientError,
    patientReadOnly: c.patientReadOnly,
  };

  const testProps = {
    selectedTests: c.selectedTests,
    testSearch: c.testSearch,
    onTestSearchChange: c.setTestSearch,
    filteredTests: c.filteredTests,
    onToggleTest: c.toggleTest,
    testsError: c.testsError,
  };

  const detailsProps = {
    referringPhysician: c.referringPhysician,
    priority: c.priority,
    clinicalNotes: c.clinicalNotes,
    onReferringPhysicianChange: c.setReferringPhysician,
    onPriorityChange: c.setPriority,
    onClinicalNotesChange: c.setClinicalNotes,
  };

  const paymentProps =
    mode === 'create'
      ? {
          paymentMethods: c.paymentMethods,
          paymentMethod: c.paymentMethod,
          onPaymentMethodChange: c.setPaymentMethod,
          paymentError: c.paymentError,
        }
      : undefined;

  return (
    <OrderUpsertLayout
      isModal={isModal}
      isLoading={c.isLoading}
      headerSubtitle={c.headerSubtitle}
      onCancel={c.handleCancel}
      onSubmit={c.handleSubmit}
      isSubmitting={c.isSubmitting}
      mode={mode}
      totalPrice={c.totalPrice}
      patientProps={patientProps}
      testProps={testProps}
      detailsProps={detailsProps}
      paymentProps={paymentProps}
    />
  );
};
