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
  paymentNotes: string;
  onPaymentNotesChange: (value: string) => void;
  paymentError?: string | null;
  disabled?: boolean;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  paymentMethods,
  paymentMethod,
  onPaymentMethodChange,
  paymentNotes,
  onPaymentNotesChange,
  paymentError,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-gray-500">Payment method</div>

      <div className="grid grid-cols-2 gap-3">
        {paymentMethods.map(method => {
          const isSelected = paymentMethod === method.value;
          return (
            <button
              key={method.value}
              type="button"
              disabled={disabled}
              className={`
                relative flex items-center gap-3 p-4 rounded border transition-all duration-200
                ${
                  isSelected
                    ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-200'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              onClick={() => onPaymentMethodChange(method.value)}
            >
              <div
                className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
                  ${isSelected ? 'border-sky-500' : 'border-gray-300'}
                `}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-sky-500" />}
              </div>
              <span
                className={`
                  flex-1 text-sm font-medium text-left
                  ${isSelected ? 'text-sky-900' : 'text-gray-700'}
                `}
              >
                {method.label}
              </span>
              <Icon
                name={method.icon as IconName}
                className={`w-5 h-5 ${isSelected ? 'text-sky-600' : 'text-gray-400'}`}
              />
            </button>
          );
        })}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes (optional)</label>
        <textarea
          rows={2}
          placeholder="Add payment notes..."
          value={paymentNotes}
          onChange={e => onPaymentNotesChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none disabled:opacity-50 disabled:bg-gray-50"
        />
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

  /** Patient selector */
  selectedPatient: Patient | null;
  patientSearch: string;
  onPatientSearchChange: (value: string) => void;
  filteredPatients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onClearPatient: () => void;
  patientError?: string;

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
  paymentNotes: string;
  onPaymentNotesChange: (value: string) => void;
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
  selectedPatient,
  patientSearch,
  onPatientSearchChange,
  filteredPatients,
  onSelectPatient,
  onClearPatient,
  patientError,
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
  paymentNotes,
  onPaymentNotesChange,
  paymentError,
}) => {
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
                <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
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
            <PaymentSection
              paymentMethods={paymentMethods}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={onPaymentMethodChange}
              paymentNotes={paymentNotes}
              onPaymentNotesChange={onPaymentNotesChange}
              paymentError={paymentError}
              disabled={isSubmitting}
            />
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
            variant="primary"
            size="md"
            form="order-create-form"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            icon={!isSubmitting ? <Icon name="wallet" /> : undefined}
          >
            {isSubmitting ? 'Processing...' : `Pay ${formatCurrency(totalPrice)}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

