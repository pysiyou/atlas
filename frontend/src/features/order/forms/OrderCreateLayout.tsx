import React from 'react';
import { Alert, Button, Icon } from '@/shared/ui';
import { LoadingState } from '@/shared/components';
import { formatCurrency } from '@/utils';
import type { Patient, Test, PriorityLevel } from '@/types';
import type { PaymentMethodOption, PaymentMethod } from '@/types/billing';
import type { IconName } from '@/shared/ui/Icon';
import { PatientSelect as PatientSelector } from '../components/forms/PatientSelect';
import { TestSelect as TestSelector } from '../components/forms/TestSelect';
import { OrderForm as OrderDetailsForm } from '../components/forms/OrderForm';

interface PaymentSectionProps {
  paymentMethods: PaymentMethodOption[];
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  paymentError?: string | null;
  disabled?: boolean;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  paymentMethods,
  paymentMethod,
  onPaymentMethodChange,
  paymentError,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-gray-500">Payment method</div>

      <div className="grid grid-cols-2 gap-2">
        {paymentMethods.map(method => {
          const isSelected = paymentMethod === method.value;
          return (
            <button
              key={method.value}
              type="button"
              disabled={disabled}
              className={`
                relative flex items-center gap-2.5 p-3 rounded border transition-all duration-200
                ${
                  isSelected
                    ? 'bg-white border-sky-500 border-2'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              onClick={() => onPaymentMethodChange(method.value)}
            >
              {/* Brand icon on the left */}
              <Icon
                name={method.icon as IconName}
                className={`w-7 h-7 shrink-0 ${isSelected ? 'text-sky-600' : 'text-gray-400'}`}
              />
              {/* Brand label */}
              <span
                className={`flex-1 text-xs font-medium text-left ${
                  isSelected ? 'text-gray-900' : 'text-gray-700'
                }`}
              >
                {method.label}
              </span>
              {/* Checkmark indicator in top-right */}
              <div
                className={`
                  absolute top-1/2 -translate-y-1/2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-colors
                  ${isSelected ? 'bg-green-500' : 'bg-transparent border-2 border-gray-300'}
                `}
              >
                <Icon
                  name="check"
                  className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-gray-300'}`}
                />
              </div>
            </button>
          );
        })}
      </div>

      {paymentError && (
        <Alert variant="danger" className="py-3">
          <p className="text-sm">{paymentError}</p>
        </Alert>
      )}
    </div>
  );
};

export interface OrderCreateLayoutProps {
  /** When true, hide the page header (modal already has its own title). */
  isModal: boolean;

  /** Loading state (patients/tests). */
  isLoading: boolean;

  /** Header subtitle when not modal. */
  headerSubtitle?: string;

  /** Form wiring */
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;

  /** Mode: 'create' or 'edit' */
  mode?: 'create' | 'edit';

  /** Patient selector */
  selectedPatient: Patient | null;
  patientSearch: string;
  onPatientSearchChange: (value: string) => void;
  filteredPatients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onClearPatient: () => void;
  patientError?: string;
  patientReadOnly?: boolean;

  /** Test selector */
  selectedTests: string[];
  testSearch: string;
  onTestSearchChange: (value: string) => void;
  filteredTests: Test[];
  onToggleTest: (testCode: string) => void;
  testsError?: string;

  /** Order details */
  referringPhysician: string;
  priority: PriorityLevel;
  clinicalNotes: string;
  onReferringPhysicianChange: (value: string) => void;
  onPriorityChange: (value: PriorityLevel) => void;
  onClinicalNotesChange: (value: string) => void;

  /** Payment */
  paymentMethods: PaymentMethodOption[];
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  paymentError?: string | null;

  /** Totals */
  totalPrice: number;
}

export const OrderCreateLayout: React.FC<OrderCreateLayoutProps> = ({
  isModal,
  isLoading,
  headerSubtitle,
  onSubmit,
  onCancel,
  isSubmitting,
  mode = 'create',
  selectedPatient,
  patientSearch,
  onPatientSearchChange,
  filteredPatients,
  onSelectPatient,
  onClearPatient,
  patientError,
  patientReadOnly = false,
  selectedTests,
  testSearch,
  onTestSearchChange,
  filteredTests,
  onToggleTest,
  testsError,
  totalPrice,
  referringPhysician,
  priority,
  clinicalNotes,
  onReferringPhysicianChange,
  onPriorityChange,
  onClinicalNotesChange,
  paymentMethods,
  paymentMethod,
  onPaymentMethodChange,
  paymentError,
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
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="max-w-4xl mx-auto space-y-6">
          {!isModal && (
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? 'Edit Order' : 'New Order'}
                </h1>
                {headerSubtitle && <p className="text-sm text-gray-500 mt-1">{headerSubtitle}</p>}
              </div>
            </div>
          )}

          <form id="order-create-form" onSubmit={onSubmit} className="space-y-6">
            <PatientSelector
              selectedPatient={selectedPatient}
              patientSearch={patientSearch}
              onPatientSearchChange={onPatientSearchChange}
              filteredPatients={filteredPatients}
              onSelectPatient={onSelectPatient}
              onClearSelection={onClearPatient}
              error={patientError}
              disabled={patientReadOnly}
            />

            <TestSelector
              selectedTests={selectedTests}
              testSearch={testSearch}
              onTestSearchChange={onTestSearchChange}
              filteredTests={filteredTests}
              onToggleTest={onToggleTest}
              totalPrice={totalPrice}
              error={testsError}
            />

            <OrderDetailsForm
              referringPhysician={referringPhysician}
              priority={priority}
              clinicalNotes={clinicalNotes}
              onReferringPhysicianChange={onReferringPhysicianChange}
              onPriorityChange={onPriorityChange}
              onClinicalNotesChange={onClinicalNotesChange}
            />
            {!isEditMode && (
              <PaymentSection
                paymentMethods={paymentMethods}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={onPaymentMethodChange}
                paymentError={paymentError}
                disabled={isSubmitting}
              />
            )}
          </form>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 bg-white shrink-0">
        <div className="flex items-baseline min-w-0 justify-between sm:justify-start">
          <span className="text-lg font-bold text-sky-600">{formatCurrency(totalPrice)}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 shrink-0">
          <Button type="button" variant="cancel" showIcon={true} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={isEditMode ? 'save' : 'primary'}
            size="md"
            form="order-create-form"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            icon={!isSubmitting && !isEditMode ? <Icon name="wallet" /> : undefined}
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
