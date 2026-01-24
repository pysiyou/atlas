import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks';
import {
  usePatientsList,
  usePatientSearch,
  useActiveTests,
  useTestSearch,
  useCreateOrder,
  useInvalidateOrders,
  useInvalidatePayments,
} from '@/hooks/queries';
import { createPayment, type PaymentCreate } from '@/services/api/payments';
import { displayId } from '@/utils/id-display';
import { logger } from '@/utils/logger';
import type { Order, OrderTest, Patient, Test } from '@/types';
import {
  getDefaultPaymentMethod,
  getEnabledPaymentMethods,
  type PaymentMethod,
  type PaymentMethodOption,
} from '@/types/billing';
import { useOrderForm } from './useOrderForm';

export interface UseCreateOrderControllerArgs {
  isModal: boolean;
  onClose?: () => void;
  initialPatientId?: string;
}

/**
 * Build validated order tests payload from selected test codes.
 */
function buildOrderTests(selectedTestCodes: string[], activeTests: Test[]): OrderTest[] {
  return selectedTestCodes.map(testCode => {
    const test = activeTests.find(t => t.code === testCode);
    if (!test) throw new Error(`Test ${testCode} not found`);
    return {
      testCode: test.code,
      testName: test.name,
      sampleType: test.sampleType,
      status: 'pending',
      priceAtOrder: test.price,
      results: null,
    };
  });
}

/**
 * Build a new order payload for creation.
 */
function buildNewOrder(params: {
  selectedPatient: Patient;
  selectedTests: OrderTest[];
  totalPrice: number;
  priority: Order['priority'];
  referringPhysician: string;
  clinicalNotes: string;
  currentUserId: number;
}): Omit<Order, 'orderId'> & { orderId?: number } {
  const now = new Date().toISOString();
  return {
    orderId: 0, // Temporary - backend will assign real ID
    patientId:
      typeof params.selectedPatient.id === 'string'
        ? parseInt(params.selectedPatient.id, 10)
        : params.selectedPatient.id,
    patientName: params.selectedPatient.fullName,
    orderDate: now,
    referringPhysician: params.referringPhysician.trim() || undefined,
    tests: params.selectedTests,
    priority: params.priority,
    clinicalNotes: params.clinicalNotes.trim() || undefined,
    totalPrice: params.totalPrice,
    paymentStatus: 'unpaid',
    overallStatus: 'ordered',
    createdBy: params.currentUserId,
    createdAt: now,
    updatedAt: now,
  };
}

// Large hook is necessary for comprehensive order creation logic including patient/test selection, validation, and submission
// eslint-disable-next-line max-lines-per-function
export function useCreateOrderController({
  isModal,
  onClose,
  initialPatientId,
}: UseCreateOrderControllerArgs) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  const preselectedPatientIdFromUrl = searchParams.get('patientId');
  const preselectedPatientId = useMemo(
    () => initialPatientId ?? preselectedPatientIdFromUrl ?? '',
    [initialPatientId, preselectedPatientIdFromUrl]
  );

  const [selectedPatientId, setSelectedPatientId] = useState<string>(preselectedPatientId || '');
  const [patientSearch, setPatientSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');

  const { patients, isLoading: patientsLoading } = usePatientsList();
  const { results: filteredPatientsFromSearch } = usePatientSearch(patientSearch);
  const { tests: activeTests, isLoading: testsLoading } = useActiveTests();
  const { results: filteredTestsFromSearch } = useTestSearch(testSearch);

  const createOrderMutation = useCreateOrder();
  const { invalidateAll: invalidateOrders } = useInvalidateOrders();
  const { invalidateAll: invalidatePayments } = useInvalidatePayments();

  const { formData, errors, isSubmitting, setIsSubmitting, updateField, validate, setError } =
    useOrderForm();

  const paymentMethods: PaymentMethodOption[] = useMemo(() => getEnabledPaymentMethods(), []);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() =>
    getDefaultPaymentMethod()
  );
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

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

  const totalPrice = formData.selectedTests.reduce((sum, testCode) => {
    const test = activeTests.find(t => t.code === testCode);
    return sum + (test?.price || 0);
  }, 0);

  const headerSubtitle = selectedPatient
    ? `For ${selectedPatient.fullName} (${displayId.patient(selectedPatient.id)})`
    : 'Select a patient and choose tests to create a new order.';

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
      notes: paymentNotes.trim() || undefined,
    };
    await createPayment(paymentData);
    await invalidatePayments();
    await invalidateOrders();
  };

  const toggleTest = (testCode: string) => {
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

    if (!selectedPatient) {
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
      const orderTests = buildOrderTests(formData.selectedTests, activeTests);
      const currentUserId =
        typeof currentUser?.id === 'string' ? parseInt(currentUser.id, 10) : currentUser?.id || 0;

      const newOrder = buildNewOrder({
        selectedPatient,
        selectedTests: orderTests,
        totalPrice,
        priority: formData.priority,
        referringPhysician: formData.referringPhysician,
        clinicalNotes: formData.clinicalNotes,
        currentUserId,
      });

      const createdOrder = await createOrderMutation.mutateAsync(newOrder as Order);
      await invalidateOrders();

      const orderId = createdOrder.orderId;

      try {
        await processPayment(orderId);
        if (totalPrice > 0) toast.success(`Payment received for ${displayId.order(orderId)}.`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to process payment';
        setPaymentError(message);
        toast.error(message);
      } finally {
        toast.success(`Order ${displayId.order(orderId)} created successfully!`);
        closeAndNavigateToOrder(orderId);
      }
    } catch (error) {
      logger.error('Error creating order', error instanceof Error ? error : undefined);
      const message =
        error instanceof Error ? error.message : 'Failed to create order. Please try again.';
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  return {
    // Layout wiring
    isLoading: patientsLoading || testsLoading,
    headerSubtitle,
    isSubmitting,
    handleCancel,
    handleSubmit,

    // Patient
    selectedPatient: selectedPatient || null,
    patientSearch,
    setPatientSearch,
    filteredPatients,
    selectPatient: (patient: Patient) => {
      setSelectedPatientId(patient.id.toString());
      setPatientSearch('');
    },
    clearPatient: () => {
      setSelectedPatientId('');
      setPatientSearch('');
    },

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

    // Payment
    paymentMethods,
    paymentMethod,
    setPaymentMethod,
    paymentNotes,
    setPaymentNotes,
    paymentError,

    // Totals
    totalPrice,
  };
}
