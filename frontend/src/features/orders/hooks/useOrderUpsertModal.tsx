/**
 * useOrderUpsertModal — form, search, payment, and derived state for OrderUpsertModal.
 */

import React, { useMemo, useState, useEffect } from 'react';
import type { Order, PaymentMethod } from '@/types';
import { PRIORITY_LEVEL_VALUES, PRIORITY_LEVEL_CONFIG } from '@/types';
import { displayId, formatCurrency } from '@/utils';
import { createFilterOptions } from '@/utils/filtering';
import { getErrorMessage } from '@/utils/errors';
import { useOrderForm } from './useOrderForm';
import { useTestCatalog, useTestSearch } from '@/features/catalog/data/tests';
import { usePatientSearch, usePatientsList } from '@/features/patients/data/patients';
import { useCreatePayment } from '@/features/payments/data/payments';

export interface UseOrderUpsertModalParams {
  isOpen: boolean;
  order?: Order;
  mode: 'create' | 'edit';
  patientId?: string;
  onClose: () => void;
}

export function useOrderUpsertModal({
  order,
  mode,
  patientId,
  onClose,
}: UseOrderUpsertModalParams) {
  const [patientSearch, setPatientSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const { mutate: createPaymentMutation, isPending: isProcessingPayment } = useCreatePayment();

  const initialPatientId = useMemo(() => {
    if (mode === 'create' && patientId) {
      const parsed = parseInt(patientId, 10);
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }, [mode, patientId]);

  const resetPaymentState = () => {
    setPaymentMethod(undefined);
    setPaymentError(null);
  };

  const handleClose = () => {
    if (mode === 'create') {
      resetPaymentState();
    }
    onClose();
  };

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
    setValue,
  } = useOrderForm({
    order,
    mode,
    initialPatientId,
    onSubmitSuccess: async (createdOrder?: Order) => {
      if (mode === 'create' && paymentMethod && createdOrder && createdOrder.totalPrice > 0) {
        try {
          await new Promise<void>((resolve, reject) => {
            createPaymentMutation(
              {
                orderId: createdOrder.orderId.toString(),
                amount: createdOrder.totalPrice,
                paymentMethod,
              },
              {
                onSuccess: () => resolve(),
                onError: (err: unknown) => {
                  setPaymentError(getErrorMessage(err, 'Failed to process payment'));
                  reject(err);
                },
              }
            );
          });
        } catch {
          return;
        }
      }
      handleClose();
    },
  });

  const formValues = watch();
  const selectedPatientId = formValues.patientId;
  const testCodes = formValues.testCodes;

  const { patients } = usePatientsList();
  const { results: filteredPatients } = usePatientSearch(patientSearch);
  const selectedPatient = useMemo(
    () => (selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null),
    [patients, selectedPatientId]
  );

  const { tests } = useTestCatalog();
  const { results: filteredTests } = useTestSearch(testSearch);

  const totalPrice = useMemo(() => {
    const selectedTestCodes = testCodes ?? [];
    if (!selectedTestCodes.length) return 0;
    return selectedTestCodes.reduce((sum, code) => {
      const test = tests.find(t => t.code === code);
      return sum + (test?.price || 0);
    }, 0);
  }, [testCodes, tests]);

  useEffect(() => {
    if (mode === 'create' && initialPatientId && !selectedPatientId && patients.length > 0) {
      const patient = patients.find(p => p.id === initialPatientId);
      if (patient) setValue('patientId', initialPatientId, { shouldValidate: false });
    }
  }, [mode, initialPatientId, patients, selectedPatientId, setValue]);

  const priorityOptions = useMemo(
    () => createFilterOptions(PRIORITY_LEVEL_VALUES, PRIORITY_LEVEL_CONFIG),
    []
  );

  const modalTitle = mode === 'edit' ? 'Edit Order' : 'New Order';
  const subtitle = useMemo((): React.ReactNode => {
    if (mode === 'edit' && order) {
      return (
        <span>
          Editing order <span className="font-mono">{displayId.order(order.orderId)}</span>
        </span>
      );
    }
    if (patientId) return `Creating an order for patient ${patientId}.`;
    return 'Select a patient and choose tests to create a new order.';
  }, [mode, order, patientId]);

  const submitLabel = useMemo(() => {
    if (isSubmitting || isProcessingPayment) {
      if (mode === 'edit') return 'Saving...';
      if (paymentMethod) return 'Processing...';
      return 'Creating...';
    }
    if (mode === 'edit') return 'Save Changes';
    if (paymentMethod && totalPrice > 0) return `Pay ${formatCurrency(totalPrice)}`;
    return 'Create Order';
  }, [isSubmitting, isProcessingPayment, mode, paymentMethod, totalPrice]);

  return {
    control,
    handleSubmit,
    setValue,
    isSubmitting,
    selectedPatient,
    patientSearch,
    setPatientSearch,
    filteredPatients,
    testSearch,
    setTestSearch,
    filteredTests,
    tests,
    totalPrice,
    paymentMethod,
    setPaymentMethod,
    paymentError,
    setPaymentError,
    isProcessingPayment,
    priorityOptions,
    mode,
    order,
    modalTitle,
    subtitle,
    submitLabel,
    handleClose,
  };
}

export type UseOrderUpsertModalReturn = ReturnType<typeof useOrderUpsertModal>;
