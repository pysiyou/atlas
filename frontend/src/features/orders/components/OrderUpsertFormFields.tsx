import type { useOrderUpsertModal } from '../hooks/useOrderUpsertModal';
import type { OrderFormInput } from '../schemas/order.schema';
import type { Patient, PriorityLevel } from '@/types';
import { OrderPaymentSection } from './OrderPaymentSection';
import { PatientSelect } from './PatientSelect';
import { OrderUpsertTestCodesField } from './OrderUpsertTestCodesField';
import { Textarea } from '@/components/inputs';
import { MultiSelectFilter } from '@/components/overlays';
import { Panel } from '@/components/surfaces';
import { useWorkups } from '@/features/catalog';
import { ReferentDoctorSelect } from '@/features/referent-doctors';
import { IconKeys } from '@/icons';
import { FIELD_ERROR } from '@/theme/recipes';
import { Controller, type Control } from 'react-hook-form';

interface OrderUpsertFormFieldsProps {
  control: Control<OrderFormInput>;
  mode: 'create' | 'edit';
  patientId?: string;
  modalState: Pick<
    ReturnType<typeof useOrderUpsertModal>,
    | 'selectedPatient'
    | 'patientSearch'
    | 'setPatientSearch'
    | 'filteredPatients'
    | 'testSearch'
    | 'setTestSearch'
    | 'filteredTests'
    | 'tests'
    | 'priorityOptions'
    | 'paymentMethod'
    | 'setPaymentMethod'
    | 'isSubmitting'
    | 'isProcessingPayment'
    | 'paymentError'
    | 'setPaymentError'
    | 'selectedReferentDoctor'
    | 'onSelectReferentDoctor'
    | 'onClearReferentDoctor'
    | 'onCreatePatient'
  >;
}

export function OrderUpsertFormFields({
  control,
  mode,
  patientId,
  modalState,
}: OrderUpsertFormFieldsProps) {
  const {
    selectedPatient,
    patientSearch,
    setPatientSearch,
    filteredPatients,
    testSearch,
    setTestSearch,
    filteredTests,
    tests,
    priorityOptions,
    paymentMethod,
    setPaymentMethod,
    isSubmitting,
    isProcessingPayment,
    paymentError,
    setPaymentError,
    selectedReferentDoctor,
    onSelectReferentDoctor,
    onClearReferentDoctor,
    onCreatePatient,
  } = modalState;
  const { workups } = useWorkups();

  return (
    <Panel preset="panel.page.formHiddenHeader">
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
            onCreatePatient={mode === 'create' ? onCreatePatient : undefined}
          />
        )}
      />

      <OrderUpsertTestCodesField
        control={control}
        testSearch={testSearch}
        setTestSearch={setTestSearch}
        filteredTests={filteredTests}
        tests={tests}
        workups={workups}
      />

      <ReferentDoctorSelect
        control={control}
        selectedDoctor={selectedReferentDoctor}
        onSelectDoctor={onSelectReferentDoctor}
        onClearSelection={onClearReferentDoctor}
        disabled={isSubmitting}
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
                    (selectedIds[selectedIds.length - 1] as PriorityLevel | undefined) || 'low';
                  field.onChange(next);
                }}
                placeholder="Select priority"
                showSelectAll={false}
                singleSelect={true}
                className="w-full"
                icon={IconKeys.domain.priority}
              />
              {fieldState.error && (
                <p className={`mt-space-1-5 ${FIELD_ERROR}`}>{fieldState.error.message}</p>
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
            icon={IconKeys.dataFields.clinicalNotes}
            error={fieldState.error?.message}
          />
        )}
      />

      {mode === 'create' ? (
        <OrderPaymentSection
          mode={mode}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          isSubmitting={isSubmitting}
          isProcessingPayment={isProcessingPayment}
          paymentError={paymentError}
          onClearError={() => setPaymentError(null)}
        />
      ) : null}
    </Panel>
  );
}
