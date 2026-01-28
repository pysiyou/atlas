/**
 * OrderUpsertModal
 *
 * Modal for creating a new order or editing an existing one.
 * - Create: mode === 'create', optional patientId to preselect.
 * - Edit: mode === 'edit', order required.
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Controller } from 'react-hook-form';
import type { Order, Patient, PriorityLevel, PaymentMethod } from '@/types';
import { PRIORITY_LEVEL_VALUES, PRIORITY_LEVEL_CONFIG } from '@/types';
import { getEnabledPaymentMethods, getDefaultPaymentMethod } from '@/types/billing';
import { Modal, Input, Textarea, MultiSelectFilter, Button, FooterInfo, Icon, Alert } from '@/shared/ui';
import type { BaseModalProps, IconName } from '@/shared/ui';
import { displayId, ICONS, formatCurrency } from '@/utils';
import { createFilterOptions } from '@/utils/filtering';
import { useOrderForm } from '../hooks/useOrderForm';
import { usePatientsList, usePatientSearch } from '@/hooks/queries';
import { useTestCatalog, useTestSearch } from '@/hooks/queries';
import { useCreatePayment } from '@/hooks/queries/usePayments';
import { PatientSelect } from './PatientSelect';
import { TestSelect } from './TestSelect';

export interface OrderUpsertModalProps extends BaseModalProps {
  /** Existing order when editing. */
  order?: Order;
  /** 'create' | 'edit' */
  mode: 'create' | 'edit';
  /** Preselected patient ID for create mode. */
  patientId?: string;
}

const ModalFooter: React.FC<{
  onClose: () => void;
  submitLabel: string;
  isSubmitting: boolean;
  formId: string;
  footerInfo?: React.ReactNode;
  buttonVariant?: 'save' | 'primary';
  buttonIcon?: React.ReactNode;
}> = ({ onClose, submitLabel, isSubmitting, formId, footerInfo, buttonVariant = 'save', buttonIcon }) => (
  <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-surface shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.04)]">
    {footerInfo}
    <div className="flex items-center gap-3">
      <Button type="button" variant="cancel" showIcon={true} onClick={onClose}>
        Cancel
      </Button>
      <Button
        type="submit"
        variant={buttonVariant}
        form={formId}
        isLoading={isSubmitting}
        disabled={isSubmitting}
        icon={buttonIcon}
      >
        {submitLabel}
      </Button>
    </div>
  </div>
);

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

  // Payment methods
  const paymentMethods = useMemo(() => getEnabledPaymentMethods(), []);

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
    formState: { errors, isSubmitting },
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
                  const errorMessage = err instanceof Error ? err.message : 'Failed to process payment';
                  setPaymentError(errorMessage);
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
      <div className="flex flex-col h-full bg-app-bg">
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
                  selectedPatient={selectedPatient}
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
                        const next = (selectedIds[selectedIds.length - 1] as PriorityLevel | undefined) || 'routine';
                        field.onChange(next);
                      }}
                      placeholder="Select priority"
                      showSelectAll={false}
                      singleSelect={true}
                      className="w-full"
                      icon={ICONS.actions.warning}
                    />
                    {fieldState.error && (
                      <p className="mt-1.5 text-xs text-danger">{fieldState.error.message}</p>
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
            {mode === 'create' && (
              <div>
                <label className="block text-xs font-medium text-text-tertiary mb-2">
                  Payment method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map(method => {
                    const isSelected = paymentMethod === method.value;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        disabled={isSubmitting || isProcessingPayment}
                        onClick={() => {
                          setPaymentMethod(method.value);
                          setPaymentError(null);
                        }}
                        className={`
                          relative flex items-center gap-2.5 p-3 rounded border transition-all duration-200
                          ${
                            isSelected
                              ? 'bg-surface border-brand border-2'
                              : 'bg-surface border-border hover:border-border-strong'
                          }
                          ${isSubmitting || isProcessingPayment ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        <Icon
                          name={method.icon as IconName}
                          className={`w-7 h-7 shrink-0 ${isSelected ? 'text-brand' : 'text-text-disabled'}`}
                        />
                        <span
                          className={`flex-1 text-xs font-medium text-left ${
                            isSelected ? 'text-text-primary' : 'text-text-secondary'
                          }`}
                        >
                          {method.label}
                        </span>
                        <div
                          className={`
                            absolute top-1/2 -translate-y-1/2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-colors
                            ${isSelected ? 'bg-green-600' : 'bg-transparent border-2 border-border-strong'}
                          `}
                        >
                          <Icon
                            name={ICONS.actions.check}
                            className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-text-disabled'}`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
                {paymentError && (
                  <Alert variant="danger" className="mt-3 py-3">
                    <p className="text-sm">{paymentError}</p>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <ModalFooter
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
