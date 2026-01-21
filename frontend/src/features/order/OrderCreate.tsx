import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePatients } from '@/hooks';
import { useOrders } from '@/features/order/OrderContext';
import { useTests } from '@/features/test/TestsContext';
import { useBilling } from '@/features/billing/BillingContext';
import { SectionContainer, Badge, Button } from '@/shared/ui';
import { generateOrderId, generateInvoiceId, formatCurrency } from '@/utils';
import type { Order, OrderTest, Invoice } from '@/types';
import { useAuth } from '@/hooks';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';
import { PatientSelect as PatientSelector } from './PatientSelect';
import { TestSelect as TestSelector } from './TestSelect';
import { OrderForm as OrderDetailsForm } from './OrderForm';
import { useOrderForm } from './useOrderForm';

export const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const patientsContext = usePatients();
  const ordersContext = useOrders();
  const testsContext = useTests();
  const billingContext = useBilling();

  const preselectedPatientId = searchParams.get('patientId');
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId || '');
  const [patientSearch, setPatientSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');

  const {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    updateField,
    validate,
    setError,
  } = useOrderForm();

  if (!patientsContext || !ordersContext || !testsContext || !billingContext) {
    return <div>Loading...</div>;
  }

  const { patients, searchPatients } = patientsContext;
  const { orders, addOrder, deleteOrder } = ordersContext;
  const { getActiveTests } = testsContext;
  const { invoices, addInvoice } = billingContext;

  const activeTests = getActiveTests();

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const filteredPatients = patientSearch
    ? searchPatients(patientSearch).slice(0, 5)
    : [];

  const filteredTests = testSearch
    ? activeTests
        .filter(
          (test) =>
            test.name.toLowerCase().includes(testSearch.toLowerCase()) ||
            test.code.toLowerCase().includes(testSearch.toLowerCase()) ||
            test.category.toLowerCase().includes(testSearch.toLowerCase())
        )
        .slice(0, 10)
    : activeTests.slice(0, 10);

  const totalPrice = formData.selectedTests.reduce((sum, testCode) => {
    const test = activeTests.find((t) => t.code === testCode);
    return sum + (test?.price || 0);
  }, 0);

  const toggleTest = (testCode: string) => {
    updateField(
      'selectedTests',
      formData.selectedTests.includes(testCode)
        ? formData.selectedTests.filter((t) => t !== testCode)
        : [...formData.selectedTests, testCode]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const orderId = generateOrderId(orders.map((o) => o.orderId));

      const orderTests: OrderTest[] = formData.selectedTests.map((testCode) => {
        const test = activeTests.find((t) => t.code === testCode);
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

      const newOrder: Order = {
        orderId,
        patientId: selectedPatient.id,
        patientName: selectedPatient.fullName,
        orderDate: new Date().toISOString(),
        referringPhysician: formData.referringPhysician.trim() || undefined,
        tests: orderTests,
        priority: formData.priority,
        clinicalNotes: formData.clinicalNotes.trim() || undefined,
        totalPrice,
        paymentStatus: 'unpaid',
        overallStatus: 'ordered',
        createdBy: currentUser?.id || 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create order first
      await addOrder(newOrder);

      // Then create invoice with rollback on failure
      const invoiceId = generateInvoiceId(invoices.map((i) => i.invoiceId));
      const invoice: Invoice = {
        invoiceId,
        orderId,
        patientId: selectedPatient.id,
        patientName: selectedPatient.fullName,
        items: orderTests.map((test) => {
          const testDef = activeTests.find((t) => t.code === test.testCode);
          return {
            testCode: test.testCode,
            testName: testDef?.name || 'Unknown Test', // Snapshot for billing
            quantity: 1,
            unitPrice: test.priceAtOrder,
            totalPrice: test.priceAtOrder,
          };
        }),
        subtotal: totalPrice,
        discount: 0,
        tax: 0,
        total: totalPrice,
        paymentStatus: 'unpaid',
        amountPaid: 0,
        amountDue: totalPrice,
        createdAt: new Date().toISOString(),
      };

      try {
        await addInvoice(invoice);
      } catch (invoiceError) {
        // ROLLBACK: Delete the orphaned order if invoice creation fails
        logger.error('Invoice creation failed, rolling back order', invoiceError instanceof Error ? invoiceError : undefined);
        try {
          await deleteOrder(orderId);
        } catch (rollbackError) {
          logger.error('Failed to rollback order', rollbackError instanceof Error ? rollbackError : undefined);
        }
        throw new Error('Failed to create invoice. Order has been cancelled.');
      }

      toast.success(`Order ${orderId} created successfully!`);
      navigate(`/orders/${orderId}`);
    } catch (error) {
      logger.error('Error creating order', error instanceof Error ? error : undefined);
      const message = error instanceof Error ? error.message : 'Failed to create order. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <PatientSelector
          selectedPatient={selectedPatient || null}
          patientSearch={patientSearch}
          onPatientSearchChange={setPatientSearch}
          filteredPatients={filteredPatients}
          onSelectPatient={(patient) => {
            setSelectedPatientId(patient.id);
            setPatientSearch('');
          }}
          onClearSelection={() => {
            setSelectedPatientId('');
            setPatientSearch('');
          }}
          error={errors.patient}
        />

        <TestSelector
          selectedTests={formData.selectedTests}
          testSearch={testSearch}
          onTestSearchChange={setTestSearch}
          filteredTests={filteredTests}
          onToggleTest={toggleTest}
          totalPrice={totalPrice}
          error={errors.tests}
        />

        <OrderDetailsForm
          referringPhysician={formData.referringPhysician}
          priority={formData.priority}
          clinicalNotes={formData.clinicalNotes}
          onReferringPhysicianChange={(value) => updateField('referringPhysician', value)}
          onPriorityChange={(value) => updateField('priority', value)}
          onClinicalNotesChange={(value) => updateField('clinicalNotes', value)}
        />

        <SectionContainer title="Order Summary">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Patient:</span>
              <span className="font-medium">
                {selectedPatient?.fullName || 'Not selected'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Number of Tests:</span>
              <span className="font-medium">{formData.selectedTests.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Priority:</span>
              <Badge
                variant={
                  formData.priority === 'stat'
                    ? 'danger'
                    : formData.priority === 'urgent'
                    ? 'warning'
                    : 'info'
                }
              >
                {formData.priority.toUpperCase()}
              </Badge>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold text-gray-900">Total Amount:</span>
              <span className="font-bold text-xl text-sky-600">
                {formatCurrency(totalPrice)}
              </span>
            </div>
          </div>
        </SectionContainer>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="cancel"
            showIcon={false}
            onClick={() => navigate('/orders')}
          >
            Cancel
          </Button>
          <Button type="submit" variant="create" isLoading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Creating Order...' : 'Create Order'}
          </Button>
        </div>
      </form>
    </div>
  );
};
