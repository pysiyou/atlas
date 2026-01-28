/**
 * OrderUpsertModal
 *
 * Modal for creating a new order or editing an existing one.
 * - Create: mode === 'create', optional patientId to preselect.
 * - Edit: mode === 'edit', order required.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import type { Order, Patient, PriorityLevel } from '@/types';
import { PRIORITY_LEVEL_OPTIONS } from '@/types';
import { Modal, Input, Textarea, MultiSelectFilter, Button, FooterInfo } from '@/shared/ui';
import type { BaseModalProps, FilterOption } from '@/shared/ui';
import { displayId, ICONS } from '@/utils';
import { useOrderForm } from '../hooks/useOrderForm';
import { usePatientsList, usePatientSearch } from '@/hooks/queries';
import { useTestCatalog, useTestSearch } from '@/hooks/queries';
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
}> = ({ onClose, submitLabel, isSubmitting, formId, footerInfo }) => (
  <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-surface shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.04)]">
    {footerInfo}
    <div className="flex items-center gap-3">
      <Button type="button" variant="cancel" showIcon={true} onClick={onClose}>
        Cancel
      </Button>
      <Button
        type="submit"
        variant="save"
        form={formId}
        isLoading={isSubmitting}
        disabled={isSubmitting}
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
    onSubmitSuccess: onClose,
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

  // Priority options
  const priorityOptions: FilterOption[] = useMemo(
    () =>
      PRIORITY_LEVEL_OPTIONS.map(opt => {
        const color = opt.value === 'stat' ? 'danger' : opt.value === 'urgent' ? 'warning' : 'info';
        return { id: opt.value, label: opt.label, color };
      }),
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

  const submitLabel = isSubmitting
    ? mode === 'edit'
      ? 'Saving...'
      : 'Creating...'
    : mode === 'edit'
      ? 'Save Changes'
      : 'Create Order';

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
                  disabled={mode === 'edit'}
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
                    const newValue = current.includes(code)
                      ? current.filter(c => c !== code)
                      : [...current, code];
                    field.onChange(newValue);
                  }}
                  totalPrice={totalPrice}
                  error={fieldState.error?.message}
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
                    <label className="block text-xs font-medium text-text-tertiary mb-1.5">
                      Priority <span className="text-danger">*</span>
                    </label>
                    <MultiSelectFilter
                      label="Priority"
                      options={priorityOptions}
                      selectedIds={selectedPriorityIds}
                      onChange={(selectedIds: string[]) => {
                        const next = (selectedIds[selectedIds.length - 1] as PriorityLevel | undefined) || 'routine';
                        field.onChange(next);
                      }}
                      placeholder="Select priority"
                      showSelectAll={false}
                      singleSelect={true}
                      className="w-full sm:w-full"
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
          </div>

          <ModalFooter
            onClose={onClose}
            submitLabel={submitLabel}
            isSubmitting={isSubmitting}
            formId="order-form"
            footerInfo={
              mode === 'edit' && order ? (
                <FooterInfo
                  icon={ICONS.dataFields.document}
                  text={`Editing ${displayId.order(order.orderId)}`}
                />
              ) : (
                <FooterInfo icon={ICONS.actions.add} text="Creating new order" />
              )
            }
          />
        </form>
      </div>
    </Modal>
  );
};
