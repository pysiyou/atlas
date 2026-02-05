/**
 * OrderUpsertModal
 *
 * Modal for creating a new order or editing an existing one.
 * - Create: mode === 'create', optional patientId to preselect.
 * - Edit: mode === 'edit', order required.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import type { Order, Patient, PriorityLevel, PaymentMethod } from '@/types';
import { PRIORITY_LEVEL_VALUES, PRIORITY_LEVEL_CONFIG } from '@/types';
import { Modal, Input, Textarea, MultiSelectFilter, FooterInfo, Icon } from '@/shared/ui';
import { displayId, ICONS, formatCurrency } from '@/utils';
import { createFilterOptions } from '@/utils/filtering';
import { getErrorMessage } from '@/utils/errorHelpers';
import { useOrderForm } from '../hooks/useOrderForm';
import { usePatientsList, usePatientSearch } from '@/hooks/queries';
import { useTestCatalog, useTestSearch } from '@/hooks/queries';
import { useCreatePayment } from '@/hooks/queries/usePayments';
import { PatientSelect } from './PatientSelect';
import { TestSelect } from './TestSelect';
import { OrderModalFooter } from './order-modal/OrderModalFooter';
import { OrderPaymentSection } from './order-modal/OrderPaymentSection';
import type { BaseModalProps } from '@/shared/ui';

export interface OrderUpsertModalProps extends BaseModalProps {
  /** Existing order when editing. */
  order?: Order;
  /** 'create' | 'edit' */
  mode: 'create' | 'edit';
  /** Preselected patient ID for create mode. */
  patientId?: string;
}

export const OrderUpsertModal: React.FC<OrderUpsertModalProps> = ({
  isOpen,
  onClose,
  order,
  mode,
  patientId,
}) => {
  const [patientSearch, setPatientSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Payment mutation
  const { mutate: createPaymentMutation, isPending: isProcessingPayment } = useCreatePayment();

  // Convert patientId prop (string) to number for hook
  const initialPatientId = useMemo(() => {
    if (mode === 'create' && patientId) {
      const parsed = parseInt(patientId, 10);
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }, [mode, patientId]);

  // Form hook
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors: _errors, isSubmitting },
    setValue,
  } = useOrderForm({
    order,
    mode,
    initialPatientId,
    onSubmitSuccess: async (createdOrder?: Order) => {
      // If payment method is selected and order was created, process payment
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
                onSuccess: () => {
                  resolve();
                },
                onError: (err: unknown) => {
                  setPaymentError(getErrorMessage(err, 'Failed to process payment'));
                  reject(err);
                },
              }
            );
          });
        } catch {
          // Error already handled in mutation callback
          return; // Don't close modal if payment fails
        }
      }
      onClose();
    },
  });

  // Watch form values for calculations and display
  const formValues = watch();
  const selectedPatientId = formValues.patientId;
  const selectedTestCodes = formValues.testCodes || [];

  // Patient data
  const { patients } = usePatientsList();
  const { results: filteredPatients } = usePatientSearch(patientSearch);
  const selectedPatient = useMemo(
    () => (selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null),
    [patients, selectedPatientId]
  );

  // Test data
  const { tests } = useTestCatalog();
  const { results: filteredTests } = useTestSearch(testSearch);
  
  // Calculate total price from selected tests
  const totalPrice = useMemo(() => {
    if (!selectedTestCodes.length) return 0;
    return selectedTestCodes.reduce((sum, code) => {
      const test = tests.find(t => t.code === code);
      return sum + (test?.price || 0);
    }, 0);
  }, [selectedTestCodes, tests]);

  // Preselect patient when initialPatientId is provided
  useEffect(() => {
    if (mode === 'create' && initialPatientId && !selectedPatientId && patients.length > 0) {
      const patient = patients.find(p => p.id === initialPatientId);
      if (patient) {
        setValue('patientId', initialPatientId, { shouldValidate: false });
      }
    }
  }, [mode, initialPatientId, patients, selectedPatientId, setValue]);

  // Reset payment method when modal opens/closes
  useEffect(() => {
    if (isOpen && mode === 'create') {
      setPaymentMethod(undefined);
      setPaymentError(null);
    }
  }, [isOpen, mode]);

  // Priority options for MultiSelectFilter with badges
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
    if (patientId) {
      return `Creating an order for patient ${patientId}.`;
    }
    return 'Select a patient and choose tests to create a new order.';
  }, [mode, order, patientId]);

  const submitLabel = useMemo(() => {
    if (isSubmitting || isProcessingPayment) {
      if (mode === 'edit') {
        return 'Saving...';
      }
      if (paymentMethod) {
        return 'Processing...';
      }
      return 'Creating...';
    }
    if (mode === 'edit') {
      return 'Save Changes';
    }
    if (paymentMethod && totalPrice > 0) {
      return `Pay ${formatCurrency(totalPrice)}`;
    }
    return 'Create Order';
  }, [isSubmitting, isProcessingPayment, mode, paymentMethod, totalPrice]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={subtitle}
      size="2xl"
    >
      <div className="flex flex-col h-full bg-canvas">
        <form
          id="order-form"
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Patient Selection */}
            <Controller
              name="patientId"
              control={control}
              rules={{ required: 'Patient is required' }}
              render={({ field, fieldState }) => (
                <PatientSelect
                  selectedPatient={selectedPatient ?? null}
                  patientSearch={patientSearch}
                  onPatientSearchChange={setPatientSearch}
                  filteredPatients={filteredPatients}
                  onSelectPatient={(patient: Patient) => {
                    field.onChange(patient.id);
                    setPatientSearch('');
                  }}
                  onClearSelection={() => {
                    field.onChange(undefined);
                    setPatientSearch('');
                  }}
                  error={fieldState.error?.message}
                  disabled={mode === 'edit' || !!patientId}
                />
              )}
            />

            {/* Test Selection */}
            <Controller
              name="testCodes"
              control={control}
              rules={{ required: 'At least one test is required' }}
              render={({ field, fieldState }) => (
                <TestSelect
                  selectedTests={field.value || []}
                  testSearch={testSearch}
                  onTestSearchChange={setTestSearch}
                  filteredTests={filteredTests}
                  onToggleTest={(code: string) => {
                    const current = field.value || [];
                    const isAdding = !current.includes(code);
                    const newValue = isAdding
                      ? [...current, code]
                      : current.filter(c => c !== code);
                    field.onChange(newValue);
                    // Clear search input when a test is selected
                    if (isAdding) {
                      setTestSearch('');
                    }
                  }}
                  error={fieldState.error?.message}
                  tests={tests}
                />
              )}
            />

            {/* Referring Physician */}
            <Controller
              name="referringPhysician"
              control={control}
              rules={{ required: 'Referring physician is required' }}
              render={({ field, fieldState }) => (
                <Input
                  label="Referring physician"
                  name={field.name}
                  icon={ICONS.dataFields.stethoscope}
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="e.g. Dr. Smith"
                  error={fieldState.error?.message}
                />
              )}
            />

            {/* Priority */}
            <Controller
              name="priority"
              control={control}
              rules={{ required: 'Priority is required' }}
              render={({ field, fieldState }) => {
                const selectedPriorityIds = field.value ? [field.value] : [];
                return (
                  <div>
                    <MultiSelectFilter
                      label="Priority"
                      options={priorityOptions}
                      selectedIds={selectedPriorityIds}
                      onChange={(selectedIds: string[]) => {
                        // Single-select mode: use the most recent selection
                        const next = (selectedIds[selectedIds.length - 1] as PriorityLevel | undefined) || 'low';
                        field.onChange(next);
                      }}
                      placeholder="Select priority"
                      showSelectAll={false}
                      singleSelect={true}
                      className="w-full"
                      icon={ICONS.actions.warning}
                    />
                    {fieldState.error && (
                      <p className="mt-1.5 text-xs text-danger-fg">{fieldState.error.message}</p>
                    )}
                  </div>
                );
              }}
            />

            {/* Clinical Notes */}
            <Controller
              name="clinicalNotes"
              control={control}
              render={({ field, fieldState }) => (
                <Textarea
                  label="Clinical notes"
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Clinical indication or reason for testing..."
                  helperText="Include relevant symptoms, diagnosis, or reason for testing"
                  icon={ICONS.dataFields.clinicalNotes}
                  error={fieldState.error?.message}
                />
              )}
            />

            {/* Payment Method - Only in create mode */}
            <OrderPaymentSection
              mode={mode}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              isSubmitting={isSubmitting}
              isProcessingPayment={isProcessingPayment}
              paymentError={paymentError}
              onClearError={() => setPaymentError(null)}
            />
          </div>

          <OrderModalFooter
            onClose={onClose}
            submitLabel={submitLabel}
            isSubmitting={isSubmitting || isProcessingPayment}
            formId="order-form"
            buttonVariant={paymentMethod && mode === 'create' ? 'primary' : 'save'}
            buttonIcon={paymentMethod && mode === 'create' && !isSubmitting && !isProcessingPayment ? <Icon name={ICONS.dataFields.wallet} /> : undefined}
            footerInfo={
              mode === 'edit' && order ? (
                <FooterInfo
                  icon={ICONS.dataFields.document}
                  text={`Editing ${displayId.order(order.orderId)}`}
                />
              ) : (
                <div className="text-base font-semibold text-brand">
                  Total: {formatCurrency(totalPrice)}
                </div>
              )
            }
          />
        </form>
      </div>
    </Modal>
  );
};
