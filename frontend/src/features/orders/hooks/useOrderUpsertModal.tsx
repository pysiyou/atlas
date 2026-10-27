/**
 * useOrderUpsertModal — form, search, payment, and derived state for OrderUpsertModal.
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { Order, PaymentMethod } from '@/types';
import { PRIORITY_LEVEL_VALUES, PRIORITY_LEVEL_CONFIG } from '@/types';
import { formatCurrency } from '@/utils';
import { ModalContextSubtitle } from '@/components/display';
import { createFilterOptions } from '@/utils/filtering';
import { getErrorMessage } from '@/utils/errors';
import { getFeedback } from '@/utils/feedback';
import { useOrderForm } from './useOrderForm';
import { useTestCatalog, useTestSearch } from '@/features/catalog';
import { usePatient, usePatientSearch } from '@/features/patients';
import type { ReferentDoctor } from '@/features/referent-doctors';
import { useCreatePayment } from '@/features/payments';
import { useOrder } from '../api/orders';

export interface UseOrderUpsertModalParams {
  isOpen: boolean;
  order?: Order;
  orderId?: number;
  mode: 'create' | 'edit';
  patientId?: string;
  onClose: () => void;
}

export function useOrderUpsertModal({
  order: orderProp,
  orderId,
  mode,
  patientId,
  onClose,
}: UseOrderUpsertModalParams) {
  const shouldFetchOrder = mode === 'edit' && !orderProp && orderId != null;
  const {
    order: fetchedOrder,
    isLoading: isOrderLoading,
    isError: isOrderError,
    error: orderError,
    refetch: refetchOrder,
  } = useOrder(shouldFetchOrder ? String(orderId) : undefined);
  const order = orderProp ?? fetchedOrder;
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

  const handleClose = useCallback(() => {
    if (mode === 'create') {
      resetPaymentState();
    }
    onClose();
  }, [mode, onClose]);

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
                  setPaymentError(getErrorMessage(err, getFeedback('payment.process.error').title));
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

  const { results: filteredPatients } = usePatientSearch(patientSearch);
  const selectedPatientIdKey =
    selectedPatientId != null ? String(selectedPatientId) : undefined;
  const initialPatientIdKey =
    initialPatientId != null ? String(initialPatientId) : undefined;
  const { patient: selectedPatientById } = usePatient(selectedPatientIdKey);
  const { patient: initialPatient } = usePatient(
    !selectedPatientIdKey && initialPatientIdKey ? initialPatientIdKey : undefined
  );
  const selectedPatient = selectedPatientById ?? initialPatient ?? null;

  const orderReferentDoctor = useMemo((): ReferentDoctor | null => {
    if (!order?.referentDoctorId || !order.referentDoctorName) {
      return null;
    }
    return {
      referentDoctorId: order.referentDoctorId,
      fullName: order.referentDoctorName,
      email: order.referentDoctorEmail,
      phone: order.referentDoctorPhone,
      hospitalName: order.referentDoctorHospital,
      username: order.referentDoctorUsername,
      isActive: true,
      createdAt: order.updatedAt,
      updatedAt: order.updatedAt,
    };
  }, [order]);

  const [referentDoctorOverride, setReferentDoctorOverride] = useState<
    { orderId?: number; doctor: ReferentDoctor | null } | undefined
  >(undefined);

  const selectedReferentDoctor = useMemo(() => {
    if (
      referentDoctorOverride &&
      referentDoctorOverride.orderId === order?.orderId
    ) {
      return referentDoctorOverride.doctor;
    }
    return orderReferentDoctor;
  }, [referentDoctorOverride, order?.orderId, orderReferentDoctor]);

  const onSelectReferentDoctor = useCallback(
    (doctor: ReferentDoctor) => {
      setReferentDoctorOverride({ orderId: order?.orderId, doctor });
      setValue('referentDoctorId', doctor.referentDoctorId, { shouldValidate: true });
    },
    [order?.orderId, setValue]
  );

  const onClearReferentDoctor = useCallback(() => {
    setReferentDoctorOverride({ orderId: order?.orderId, doctor: null });
    setValue('referentDoctorId', null, { shouldValidate: true });
  }, [order?.orderId, setValue]);

  const { tests, byCode } = useTestCatalog();
  const { results: filteredTests } = useTestSearch(testSearch);

  const totalPrice = useMemo(() => {
    const selectedTestCodes = testCodes ?? [];
    if (!selectedTestCodes.length) return 0;
    return selectedTestCodes.reduce((sum, code) => {
      const test = byCode.get(code);
      return sum + (test?.price || 0);
    }, 0);
  }, [testCodes, byCode]);

  useEffect(() => {
    if (mode === 'create' && initialPatientId != null && selectedPatientId == null) {
      setValue('patientId', initialPatientId, { shouldValidate: false });
    }
  }, [mode, initialPatientId, selectedPatientId, setValue]);

  const priorityOptions = useMemo(
    () => createFilterOptions(PRIORITY_LEVEL_VALUES, PRIORITY_LEVEL_CONFIG),
    []
  );

  const modalTitle = mode === 'edit' ? 'Edit Order' : 'New Order';
  const subtitle = useMemo((): React.ReactNode => {
    if (mode === 'edit' && order) {
      return (
        <ModalContextSubtitle label={order.patientName} orderId={order.orderId} />
      );
    }
    if (selectedPatient) {
      return (
        <ModalContextSubtitle
          label={selectedPatient.fullName}
          patientId={selectedPatient.id}
        />
      );
    }
    return 'Select a patient to continue';
  }, [mode, order, selectedPatient]);

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
    selectedReferentDoctor,
    onSelectReferentDoctor,
    onClearReferentDoctor,
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
    isOrderLoading,
    isOrderError,
    orderError,
    refetchOrder,
  };
}

export type UseOrderUpsertModalReturn = ReturnType<typeof useOrderUpsertModal>;
