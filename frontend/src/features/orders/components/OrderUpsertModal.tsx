/**
 * OrderUpsertModal
 *
 * Modal for creating a new order or editing an existing one.
 * Logic lives in useOrderUpsertModal; this component is presentational.
 */

import React from 'react';
import { Controller } from 'react-hook-form';
import type { Order, Patient, PriorityLevel } from '@/types';
import { Modal, Input, Textarea, MultiSelectFilter, FooterInfo, Icon } from '@/components';
import { displayId, ICONS, formatCurrency } from '@/utils';
import { useOrderUpsertModal } from '../hooks/useOrderUpsertModal';
import { PatientSelect } from './PatientSelect';
import { TestSelect } from './TestSelect';
import { OrderModalFooter } from './order-modal/OrderModalFooter';
import { OrderPaymentSection } from './order-modal/OrderPaymentSection';
import type { BaseModalProps } from '@/components';

export interface OrderUpsertModalProps extends BaseModalProps {
  order?: Order;
  mode: 'create' | 'edit';
  patientId?: string;
}

export const OrderUpsertModal: React.FC<OrderUpsertModalProps> = ({
  isOpen,
  onClose,
  order,
  mode,
  patientId,
}) => {
  const {
    control,
    handleSubmit,
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
    modalTitle,
    subtitle,
    submitLabel,
  } = useOrderUpsertModal({ isOpen, order, mode, patientId, onClose });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={subtitle}
      size="2xl"
      disableClose={isSubmitting || isProcessingPayment}
    >
      <div className="flex flex-col h-full bg-surface-page">
        <form id="order-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
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
                    if (isAdding) setTestSearch('');
                  }}
                  error={fieldState.error?.message}
                  tests={tests}
                />
              )}
            />

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
                        const next =
                          (selectedIds[selectedIds.length - 1] as PriorityLevel | undefined) ||
                          'low';
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
            buttonIcon={
              paymentMethod && mode === 'create' && !isSubmitting && !isProcessingPayment ? (
                <Icon name={ICONS.dataFields.wallet} />
              ) : undefined
            }
            footerInfo={
              mode === 'edit' && order ? (
                <FooterInfo
                  icon={ICONS.dataFields.document}
                  text={`Editing ${displayId.order(order.orderId)}`}
                />
              ) : (
                <div className="text-base font-normal text-brand">
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
