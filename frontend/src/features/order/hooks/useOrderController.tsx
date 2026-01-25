import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useInvalidateOrders } from '@/hooks/queries';
import { displayId } from '@/utils/id-display';
import { logger } from '@/utils/logger';
import type { Order } from '@/types';
import { useOrderForm } from './useOrderForm';
import { useOrderMutation } from './useOrderMutation';
import { useOrderPatientSelection } from './useOrderPatientSelection';
import { useOrderTestSelection } from './useOrderTestSelection';
import { useOrderPayment } from './useOrderPayment';
import {
  computeOrderTotalPrice,
  getTestsToRemove,
} from '../utils/orderPayloadBuilder';

export interface UseOrderControllerArgs {
  isModal: boolean;
  onClose?: () => void;
  initialPatientId?: string;
  mode?: 'create' | 'edit';
  existingOrder?: Order;
}

/**
 * Orchestrates order create/edit: composes patient, test, form, mutation, and
 * payment hooks; handles validation, submit flow, and navigation.
 */
// eslint-disable-next-line max-lines-per-function
export function useOrderController({
  isModal,
  onClose,
  initialPatientId,
  mode = 'create',
  existingOrder,
}: UseOrderControllerArgs) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { invalidateAll: invalidateOrders } = useInvalidateOrders();

  const preselectedPatientId = useMemo(
    () => initialPatientId ?? searchParams.get('patientId') ?? '',
    [initialPatientId, searchParams]
  );

  const initialPatientIdForForm = useMemo(() => {
    if (mode === 'edit' && existingOrder) {
      return existingOrder.patientId.toString();
    }
    return preselectedPatientId || '';
  }, [mode, existingOrder, preselectedPatientId]);

  const isEditMode = mode === 'edit';
  const patientReadOnly = isEditMode;

  const {
    formData,
    errors,
    isSubmitting: isFormSubmitting,
    setIsSubmitting,
    updateField,
    validate,
    setError,
    reset,
  } = useOrderForm(mode === 'edit' && existingOrder ? existingOrder : undefined);

  const { handleCreateOrder, handleUpdateOrder, isSubmitting: isMutationSubmitting } =
    useOrderMutation({
      existingOrder: isEditMode ? existingOrder : undefined,
      onSuccess: () => {
        reset();
        if (isModal && onClose) onClose();
      },
    });

  const patient = useOrderPatientSelection({
    initialPatientId: initialPatientIdForForm,
    patientReadOnly,
  });

  const testSelection = useOrderTestSelection({
    selectedTests: formData.selectedTests,
    updateField,
    isEditMode,
    existingOrder,
  });

  const totalPrice = useMemo(
    () =>
      computeOrderTotalPrice(
        formData.selectedTests,
        testSelection.activeTests,
        isEditMode ? existingOrder : undefined
      ),
    [formData.selectedTests, testSelection.activeTests, isEditMode, existingOrder]
  );

  const payment = useOrderPayment({ totalPrice });

  const isLoading = patient.isLoading || testSelection.isLoading;

  const headerSubtitle = useMemo((): React.ReactNode => {
    if (isEditMode && existingOrder) {
      return (
        <span>
          Editing order <span className="font-mono">{displayId.order(existingOrder.orderId)}</span>
        </span>
      );
    }
    if (patient.selectedPatient) {
      return (
        <span>
          For {patient.selectedPatient.fullName} (<span className="font-mono">{displayId.patient(patient.selectedPatient.id)}</span>)
        </span>
      );
    }
    return 'Select a patient and choose tests to create a new order.';
  }, [isEditMode, existingOrder, patient.selectedPatient]);

  const handleCancel = () => {
    if (isModal && onClose) {
      onClose();
      return;
    }
    navigate('/orders');
  };

  const closeAndNavigateToOrder = (orderId: number) => {
    if (isModal && onClose) onClose();
    navigate(`/orders/${orderId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    payment.setPaymentError(null);

    if (!isEditMode && !patient.selectedPatient) {
      setError('patient', 'Please select a patient');
      toast.error('Please select a patient');
      return;
    }

    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        if (!existingOrder) {
          toast.error('Missing order data for edit');
          setIsSubmitting(false);
          return;
        }
        const testsToRemove = getTestsToRemove(formData.selectedTests, existingOrder);
        const testsWithResults = existingOrder.tests.filter(
          t => testsToRemove.includes(t.testCode) && t.results
        );
        if (testsWithResults.length > 0) {
          toast.error('Cannot remove tests that have results entered');
          setIsSubmitting(false);
          return;
        }
        await handleUpdateOrder(formData, testSelection.activeTests);
        await invalidateOrders();
        if (isModal && onClose) onClose();
      } else {
        if (!patient.selectedPatient) {
          toast.error('Please select a patient');
          setIsSubmitting(false);
          return;
        }
        const createdOrder = await handleCreateOrder(
          formData,
          patient.selectedPatient,
          testSelection.activeTests
        );
        await invalidateOrders();
        const orderId = createdOrder.orderId;
        try {
          await payment.processPayment(orderId);
          if (totalPrice > 0) {
            toast.success(`Payment received for ${displayId.order(orderId)}.`);
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to process payment';
          payment.setPaymentError(message);
          toast.error(message);
        } finally {
          closeAndNavigateToOrder(orderId);
        }
      }
    } catch (error) {
      logger.error(
        `Error ${isEditMode ? 'updating' : 'creating'} order`,
        error instanceof Error ? error : undefined
      );
      const message =
        error instanceof Error
          ? error.message
          : `Failed to ${isEditMode ? 'update' : 'create'} order. Please try again.`;
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  return {
    isLoading,
    headerSubtitle,
    isSubmitting: isFormSubmitting || isMutationSubmitting,
    handleCancel,
    handleSubmit,

    selectedPatient: patient.selectedPatient,
    patientSearch: patient.patientSearch,
    setPatientSearch: patient.setPatientSearch,
    filteredPatients: patient.filteredPatients,
    selectPatient: patient.selectPatient,
    clearPatient: patient.clearPatient,
    patientReadOnly: patient.patientReadOnly,

    selectedTests: formData.selectedTests,
    testSearch: testSelection.testSearch,
    setTestSearch: testSelection.setTestSearch,
    filteredTests: testSelection.filteredTests,
    toggleTest: testSelection.toggleTest,

    referringPhysician: formData.referringPhysician,
    priority: formData.priority,
    clinicalNotes: formData.clinicalNotes,
    setReferringPhysician: (value: string) => updateField('referringPhysician', value),
    setPriority: (value: Order['priority']) => updateField('priority', value),
    setClinicalNotes: (value: string) => updateField('clinicalNotes', value),

    patientError: errors.patient,
    testsError: errors.tests,

    paymentMethods: payment.paymentMethods,
    paymentMethod: payment.paymentMethod,
    setPaymentMethod: payment.setPaymentMethod,
    paymentError: payment.paymentError,

    totalPrice,
    mode,
  };
}
