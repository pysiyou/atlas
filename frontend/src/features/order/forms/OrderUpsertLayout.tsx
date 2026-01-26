import React from 'react';
import { Button, Icon } from '@/shared/ui';
import { LoadingState } from '@/shared/components';
import { formatCurrency } from '@/utils';
import type { Patient, Test, PriorityLevel } from '@/types';
import type { PaymentMethodOption, PaymentMethod } from '@/types/billing';
import { PatientSelect as PatientSelector } from '../components/forms/PatientSelect';
import { TestSelect as TestSelector } from '../components/forms/TestSelect';
import { OrderForm as OrderDetailsForm } from '../components/forms/OrderForm';
import { PaymentSection } from '../components/forms/PaymentSection';
import { ICONS } from '@/utils/icon-mappings';

/** Grouped props for patient selection section */
export interface OrderUpsertLayoutPatientProps {
  selectedPatient: Patient | null;
  patientSearch: string;
  onPatientSearchChange: (value: string) => void;
  filteredPatients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onClearPatient: () => void;
  patientError?: string;
  patientReadOnly?: boolean;
}

/** Grouped props for test selection section */
export interface OrderUpsertLayoutTestProps {
  selectedTests: string[];
  testSearch: string;
  onTestSearchChange: (value: string) => void;
  filteredTests: Test[];
  onToggleTest: (testCode: string) => void;
  testsError?: string;
}

/** Grouped props for order details (referring physician, priority, notes) */
export interface OrderUpsertLayoutDetailsProps {
  referringPhysician: string;
  priority: PriorityLevel;
  clinicalNotes: string;
  onReferringPhysicianChange: (value: string) => void;
  onPriorityChange: (value: PriorityLevel) => void;
  onClinicalNotesChange: (value: string) => void;
}

/** Grouped props for payment section (create mode only) */
export interface OrderUpsertLayoutPaymentProps {
  paymentMethods: PaymentMethodOption[];
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  paymentError?: string | null;
}

export interface OrderUpsertLayoutProps {
  /** When true, hide the page header (modal already has its own title). */
  isModal: boolean;
  /** Loading state (patients/tests). */
  isLoading: boolean;
  /** Header subtitle when not modal. */
  headerSubtitle?: React.ReactNode;
  /** Form wiring */
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  /** Mode: 'create' or 'edit' */
  mode?: 'create' | 'edit';
  /** Display total; used in footer and test selector */
  totalPrice: number;

  patientProps: OrderUpsertLayoutPatientProps;
  testProps: OrderUpsertLayoutTestProps;
  detailsProps: OrderUpsertLayoutDetailsProps;
  /** Omit in edit mode (no payment section) */
  paymentProps?: OrderUpsertLayoutPaymentProps;
}

export const OrderUpsertLayout: React.FC<OrderUpsertLayoutProps> = ({
  isModal,
  isLoading,
  headerSubtitle,
  onSubmit,
  onCancel,
  isSubmitting,
  mode = 'create',
  totalPrice,
  patientProps,
  testProps,
  detailsProps,
  paymentProps,
}) => {
  const isEditMode = mode === 'edit';
  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-slate-50">
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="max-w-4xl mx-auto">
            <LoadingState message="Loading order form..." fullScreen={false} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="max-w-4xl mx-auto space-y-6">
          {!isModal && (
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-text-primary">
                  {isEditMode ? 'Edit Order' : 'New Order'}
                </h1>
                {headerSubtitle && <p className="text-sm text-text-muted mt-1">{headerSubtitle}</p>}
              </div>
            </div>
          )}

          <form id="order-upsert-form" onSubmit={onSubmit} className="space-y-6">
            <PatientSelector
              selectedPatient={patientProps.selectedPatient}
              patientSearch={patientProps.patientSearch}
              onPatientSearchChange={patientProps.onPatientSearchChange}
              filteredPatients={patientProps.filteredPatients}
              onSelectPatient={patientProps.onSelectPatient}
              onClearSelection={patientProps.onClearPatient}
              error={patientProps.patientError}
              disabled={patientProps.patientReadOnly ?? false}
            />

            <TestSelector
              selectedTests={testProps.selectedTests}
              testSearch={testProps.testSearch}
              onTestSearchChange={testProps.onTestSearchChange}
              filteredTests={testProps.filteredTests}
              onToggleTest={testProps.onToggleTest}
              totalPrice={totalPrice}
              error={testProps.testsError}
            />

            <OrderDetailsForm
              referringPhysician={detailsProps.referringPhysician}
              priority={detailsProps.priority}
              clinicalNotes={detailsProps.clinicalNotes}
              onReferringPhysicianChange={detailsProps.onReferringPhysicianChange}
              onPriorityChange={detailsProps.onPriorityChange}
              onClinicalNotesChange={detailsProps.onClinicalNotesChange}
            />
            {!isEditMode && paymentProps && (
              <PaymentSection
                paymentMethods={paymentProps.paymentMethods}
                paymentMethod={paymentProps.paymentMethod}
                onPaymentMethodChange={paymentProps.onPaymentMethodChange}
                paymentError={paymentProps.paymentError}
                disabled={isSubmitting}
              />
            )}
          </form>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-t border-border bg-surface shrink-0">
        <div className="flex items-baseline min-w-0 justify-between sm:justify-start">
          <span className="text-lg font-bold text-brand">{formatCurrency(totalPrice)}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 shrink-0">
          <Button type="button" variant="cancel" showIcon={true} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={isEditMode ? 'save' : 'primary'}
            size="md"
            form="order-upsert-form"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            icon={!isSubmitting && !isEditMode ? <Icon name={ICONS.dataFields.wallet} /> : undefined}
          >
            {isSubmitting
              ? isEditMode
                ? 'Saving...'
                : 'Processing...'
              : isEditMode
                ? 'Save Changes'
                : `Pay ${formatCurrency(totalPrice)}`}
          </Button>
        </div>
      </div>
    </div>
  );
};
