import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  usePatientsList,
  usePatientSearch,
  useActiveTests,
  useTestSearch,
  useInvalidateOrders,
  useInvalidatePayments,
} from '@/hooks/queries';
import { createPayment, type PaymentCreate } from '@/services/api/payments';
import { displayId } from '@/utils/id-display';
import { logger } from '@/utils/logger';
import type { Order, Patient } from '@/types';
import {
  getDefaultPaymentMethod,
  getEnabledPaymentMethods,
  type PaymentMethod,
  type PaymentMethodOption,
} from '@/types/billing';
import { useOrderForm } from './useOrderForm';
import { useOrderMutation } from './useOrderMutation';
import { getTestsToRemove } from '../utils/orderPayloadBuilder';

export interface UseOrderControllerArgs {
  isModal: boolean;
  onClose?: () => void;
  initialPatientId?: string;
  mode?: 'create' | 'edit';
  existingOrder?: Order;
}

// Large hook is necessary for comprehensive order creation/editing logic including patient/test selection, validation, and submission
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

  const preselectedPatientIdFromUrl = searchParams.get('patientId');
  const preselectedPatientId = useMemo(
    () => initialPatientId ?? preselectedPatientIdFromUrl ?? '',
    [initialPatientId, preselectedPatientIdFromUrl]
  );

  // In edit mode, use patient from existing order; otherwise use initialPatientId
  const initialPatientIdForForm = useMemo(() => {
    if (mode === 'edit' && existingOrder) {
      return existingOrder.patientId.toString();
    }
    return preselectedPatientId || '';
  }, [mode, existingOrder, preselectedPatientId]);

  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientIdForForm);
  const [patientSearch, setPatientSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');

  const { patients, isLoading: patientsLoading } = usePatientsList();
  const { results: filteredPatientsFromSearch } = usePatientSearch(patientSearch);
  const { tests: activeTests, isLoading: testsLoading } = useActiveTests();
  const { results: filteredTestsFromSearch } = useTestSearch(testSearch);

  const { invalidateAll: invalidateOrders } = useInvalidateOrders();
  const { invalidateAll: invalidatePayments } = useInvalidatePayments();

  // Initialize form with existing order data in edit mode
  const { formData, errors, isSubmitting, setIsSubmitting, updateField, validate, setError, reset } =
    useOrderForm(mode === 'edit' && existingOrder ? existingOrder : undefined);

  const { handleCreateOrder, handleUpdateOrder, isSubmitting: isMutationSubmitting } =
    useOrderMutation({
      existingOrder: mode === 'edit' ? existingOrder : undefined,
      onSuccess: () => {
        reset();
        if (isModal && onClose) {
          onClose();
        } else if (mode === 'create') {
          // Navigation handled in handleSubmit for create mode
        }
      },
    });

  const paymentMethods: PaymentMethodOption[] = useMemo(() => getEnabledPaymentMethods(), []);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() =>
    getDefaultPaymentMethod()
  );
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // In edit mode, patient is read-only
  const isEditMode = mode === 'edit';
  const patientReadOnly = isEditMode;

  const numericPatientId = selectedPatientId
    ? typeof selectedPatientId === 'string'
      ? parseInt(selectedPatientId, 10)
      : selectedPatientId
    : null;
  const selectedPatient = numericPatientId
    ? patients.find(p => p.id === numericPatientId)
    : undefined;

  const filteredPatients = patientSearch ? filteredPatientsFromSearch.slice(0, 5) : [];
  const filteredTests = testSearch
    ? filteredTestsFromSearch.slice(0, 10)
    : activeTests.slice(0, 10);

  // Calculate total price
  // In edit mode: existing tests keep their priceAtOrder, new tests use current price
  const totalPrice = useMemo(() => {
    if (isEditMode && existingOrder) {
      const existingTestCodes = new Set(existingOrder.tests.map(t => t.testCode));
      const existingTestsPrice = existingOrder.tests
        .filter(t => formData.selectedTests.includes(t.testCode))
        .reduce((sum, test) => sum + test.priceAtOrder, 0);
      
      const newTestCodes = formData.selectedTests.filter(code => !existingTestCodes.has(code));
      const newTestsPrice = newTestCodes.reduce((sum, testCode) => {
        const test = activeTests.find(t => t.code === testCode);
        return sum + (test?.price || 0);
      }, 0);
      
      return existingTestsPrice + newTestsPrice;
    }
    
    // Create mode: use current test prices
    return formData.selectedTests.reduce((sum, testCode) => {
      const test = activeTests.find(t => t.code === testCode);
      return sum + (test?.price || 0);
    }, 0);
  }, [formData.selectedTests, activeTests, isEditMode, existingOrder]);

  const headerSubtitle = useMemo(() => {
    if (isEditMode && existingOrder) {
      return `Editing order ${displayId.order(existingOrder.orderId)}`;
    }
    if (selectedPatient) {
      return `For ${selectedPatient.fullName} (${displayId.patient(selectedPatient.id)})`;
    }
    return 'Select a patient and choose tests to create a new order.';
  }, [isEditMode, existingOrder, selectedPatient]);

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

  const processPayment = async (orderId: number): Promise<void> => {
    if (totalPrice <= 0) return;
    const paymentData: PaymentCreate = {
      orderId,
      amount: totalPrice,
      paymentMethod,
      notes: undefined,
    };
    await createPayment(paymentData);
    await invalidatePayments();
    await invalidateOrders();
  };

  const toggleTest = (testCode: string) => {
    // In edit mode, prevent removing tests that have results
    if (isEditMode && existingOrder) {
      const existingTest = existingOrder.tests.find(t => t.testCode === testCode);
      if (existingTest && existingTest.results) {
        toast.error('Cannot remove test that has results entered');
        return;
      }
    }
    
    updateField(
      'selectedTests',
      formData.selectedTests.includes(testCode)
        ? formData.selectedTests.filter(t => t !== testCode)
        : [...formData.selectedTests, testCode]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (!isEditMode && !selectedPatient) {
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
        // Edit mode: update existing order
        if (!existingOrder) {
          toast.error('Missing order data for edit');
          setIsSubmitting(false);
          return;
        }

        // Check if any tests with results are being removed
        const testsToRemove = getTestsToRemove(formData.selectedTests, existingOrder);
        const testsWithResults = existingOrder.tests.filter(
          t => testsToRemove.includes(t.testCode) && t.results
        );
        
        if (testsWithResults.length > 0) {
          toast.error('Cannot remove tests that have results entered');
          setIsSubmitting(false);
          return;
        }

        await handleUpdateOrder(formData, activeTests);
        await invalidateOrders();
        
        // Don't navigate in edit mode, just close modal if applicable
        if (isModal && onClose) {
          onClose();
        }
      } else {
        // Create mode: create new order
        if (!selectedPatient) {
          toast.error('Please select a patient');
          setIsSubmitting(false);
          return;
        }

        const createdOrder = await handleCreateOrder(formData, selectedPatient, activeTests);
        await invalidateOrders();

        const orderId = createdOrder.orderId;

        // Process payment for new orders
        try {
          await processPayment(orderId);
          if (totalPrice > 0) {
            toast.success(`Payment received for ${displayId.order(orderId)}.`);
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to process payment';
          setPaymentError(message);
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
    // Layout wiring
    isLoading: patientsLoading || testsLoading,
    headerSubtitle,
    isSubmitting: isSubmitting || isMutationSubmitting,
    handleCancel,
    handleSubmit,

    // Patient
    selectedPatient: selectedPatient || null,
    patientSearch,
    setPatientSearch,
    filteredPatients,
    selectPatient: (patient: Patient) => {
      if (!patientReadOnly) {
        setSelectedPatientId(patient.id.toString());
        setPatientSearch('');
      }
    },
    clearPatient: () => {
      if (!patientReadOnly) {
        setSelectedPatientId('');
        setPatientSearch('');
      }
    },
    patientReadOnly,

    // Tests
    selectedTests: formData.selectedTests,
    testSearch,
    setTestSearch,
    filteredTests,
    toggleTest,

    // Details
    referringPhysician: formData.referringPhysician,
    priority: formData.priority,
    clinicalNotes: formData.clinicalNotes,
    setReferringPhysician: (value: string) => updateField('referringPhysician', value),
    setPriority: (value: Order['priority']) => updateField('priority', value),
    setClinicalNotes: (value: string) => updateField('clinicalNotes', value),

    // Errors
    patientError: errors.patient,
    testsError: errors.tests,

    // Payment (only for create mode)
    paymentMethods,
    paymentMethod,
    setPaymentMethod,
    paymentError,

    // Totals
    totalPrice,

    // Mode
    mode,
  };
}
