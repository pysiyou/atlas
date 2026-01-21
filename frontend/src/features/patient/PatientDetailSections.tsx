/**
 * Patient Detail Section Components
 * Consolidates all patient detail page section components:
 * - PatientInfoCard: Displays comprehensive patient information
 * - AffiliationCard: Displays lab affiliation/insurance card
 * - MedicalHistoryCard: Displays patient medical history
 * - OrderHistoryCard: Displays patient order history
 */

import React from 'react';
import { SectionContainer, Badge, Button, Icon } from '@/shared/ui';
import { formatDate, calculateAge, formatPhoneNumber, formatCurrency } from '@/utils';
import type { Patient, Affiliation, Order } from '@/types';
import { AFFILIATION_DURATION_OPTIONS } from '@/types';
import { isAffiliationActive } from './usePatientForm';

// ============================================================================
// PatientInfoCard Component
// ============================================================================

interface PatientInfoCardProps {
  patient: Patient;
}

export const PatientInfoCard: React.FC<PatientInfoCardProps> = ({ patient }) => {
  const getDurationLabel = (months: number) => {
    const option = AFFILIATION_DURATION_OPTIONS.find(opt => opt.value === months);
    return option?.label || `${months} Months`;
  };

  return (
    <SectionContainer 
      title="Patient Information" 
      className="h-full flex flex-col"
      contentClassName="flex flex-col gap-4 flex-1 overflow-y-auto"
    >
        
        {/* Patient ID Section */}
        <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
          <Icon name="user" className="w-5 h-5 text-gray-400 mt-1" />
          <div className="flex-1">
            <div className="text-xs text-gray-600 mb-1">Patient ID</div>
            <div className="font-mono font-medium text-gray-900">{patient.id}</div>
          </div>
        </div>
        
        {/* Demographics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Icon name="user" className="w-5 h-5 text-gray-400 mt-1" />
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Full Name</div>
              <div className="font-medium text-gray-900">{patient.fullName}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Icon name="user" className="w-5 h-5 text-gray-400 mt-1" />
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Age & Gender</div>
              <div className="font-medium text-gray-900">
                {calculateAge(patient.dateOfBirth)} years old •{' '}
                {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                DOB: {formatDate(patient.dateOfBirth)}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Icon name="phone" className="w-5 h-5 text-gray-400 mt-1" />
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Phone</div>
              <div className="font-medium text-gray-900">{formatPhoneNumber(patient.phone)}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Icon name="mail" className="w-5 h-5 text-gray-400 mt-1" />
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Email</div>
              <div className="font-medium text-gray-900">{patient.email || 'Not provided'}</div>
            </div>
          </div>

          <div className="flex items-start gap-3 md:col-span-2">
            <Icon name="map-pin" className="w-5 h-5 text-gray-400 mt-1" />
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Address</div>
              <div className="font-medium text-gray-900">{patient.address.street}</div>
              <div className="text-xs text-gray-500 mt-1">
                {patient.address.city}, {patient.address.postalCode}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-start gap-3">
            <Icon name="user-hands" className="w-5 h-5 text-gray-400 mt-1" />
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-2">Emergency Contact</div>
              <div className="font-medium text-gray-900">{patient.emergencyContact.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatPhoneNumber(patient.emergencyContact.phone)}
              </div>
            </div>
          </div>
        </div>

        {/* Lab Affiliation Section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-start gap-3">
            <Icon name="shield" className="w-5 h-5 text-gray-400 mt-1" />
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-2">Lab Affiliation</div>
              {!patient.affiliation ? (
                <Badge variant="default" size="sm" className="border-none font-medium">
                  No Affiliation
                </Badge>
              ) : (
                <div className="flex flex-col gap-2">
                  <Badge
                    variant={isAffiliationActive(patient.affiliation) ? 'success' : 'danger'}
                    size="sm"
                    className="border-none font-medium"
                  >
                    {isAffiliationActive(patient.affiliation) ? 'Active' : 'Expired'}
                  </Badge>
                  <div className="text-xs text-gray-500">
                    Assurance #: <span className="font-mono font-medium text-gray-900">{patient.affiliation.assuranceNumber}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Duration: <span className="font-medium text-gray-900">{getDurationLabel(patient.affiliation.duration)}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Expires: <span className={`font-medium ${isAffiliationActive(patient.affiliation) ? 'text-gray-900' : 'text-red-600'}`}>
                      {formatDate(patient.affiliation.endDate)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Registration & Metadata Section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Icon name="calendar" className="w-5 h-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <div className="text-xs text-gray-600 mb-1">Registration Date</div>
                <div className="font-medium text-gray-900">{formatDate(patient.registrationDate)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Registered by: {patient.createdBy}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Icon name="clock" className="w-5 h-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <div className="text-xs text-gray-600 mb-1">Last Updated</div>
                <div className="font-medium text-gray-900">{formatDate(patient.updatedAt)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Updated by: {patient.updatedBy}
                </div>
              </div>
            </div>
          </div>
        </div>
    </SectionContainer>
  );
};

// ============================================================================
// AffiliationCard Component
// ============================================================================

interface AffiliationCardProps {
  holderName: string;
  affiliation?: Affiliation;
  className?: string;
}

export const AffiliationCard: React.FC<AffiliationCardProps> = ({
  holderName,
  affiliation,
  className = ""
}) => {
  const isActive = isAffiliationActive(affiliation);

  const formatAffiliationDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // If no affiliation, show placeholder card
  if (!affiliation) {
    return (
      <div
        className={`relative w-full h-full flex items-center justify-center ${className}`}
        aria-label={`No affiliation for ${holderName}`}
      >
        <div className="w-full h-full max-w-[340px] max-h-[180px]">
          <div className="w-full h-full rounded-xl overflow-hidden p-4 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 text-white flex flex-col justify-between shadow-lg">
            {/* Header */}
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium tracking-wide text-white/90">Lab Affiliation</h3>
            </div>

            {/* Middle Section */}
            <div className="flex items-center justify-center flex-1">
              <p className="text-white/80 text-sm">No active affiliation</p>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-white/60 font-medium">Holder</span>
                <span className="text-sm font-medium tracking-wide">{holderName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active card: vibrant gradient
  // Expired card: muted/gray gradient
  const gradientClass = isActive
    ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500'
    : 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600';

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center ${className}`}
      aria-label={`Affiliation card for ${holderName}`}
    >
      <div className="w-full h-full max-w-[340px] max-h-[180px]">
        <div className={`w-full h-full rounded-xl overflow-hidden p-4 ${gradientClass} text-white flex flex-col justify-between shadow-lg`}>
          {/* Header */}
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium tracking-wide text-white/90">Lab Affiliation</h3>
            <div className="flex items-center">
              {isActive ? (
                  <Icon 
                    name="verified" 
                    className="w-7 h-7 text-white" 
                    aria-label="Verified affiliation"
                  />
              ) : (
                <>
                  <Icon name="x-circle" className="w-4 h-4 text-white/80" />
                  <span className="text-xs font-medium text-white/80">Expired</span>
                </>
              )}
            </div>
          </div>

          {/* Middle Section: Logo and Number */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm ${isActive ? 'text-teal-600' : 'text-gray-500'}`}>
               <Icon name="app-logo" className="w-5 h-5" />
            </div>

            {/* Assurance Number */}
            <div className="flex items-center gap-2">
              <div className="text-base font-bold tracking-wide text-white drop-shadow-sm">
                {affiliation.assuranceNumber}
              </div>
            </div>
          </div>

          {/* Footer: Holder and Expiry */}
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-white/60 font-medium">Holder</span>
              <span className="text-sm font-medium tracking-wide">{holderName}</span>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span className="text-xs text-white/60 font-medium">Expiry</span>
              <span className={`text-sm font-medium tracking-wide ${!isActive ? 'text-red-200' : ''}`}>
                {formatAffiliationDate(affiliation.endDate)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MedicalHistoryCard Component
// ============================================================================

interface MedicalHistoryCardProps {
  patient: Patient;
}

export const MedicalHistoryCard: React.FC<MedicalHistoryCardProps> = ({ patient }) => {
  const { medicalHistory } = patient;

  return (
    <SectionContainer 
      title="Medical History"
      className="h-full flex flex-col"
      contentClassName="flex flex-col gap-4 flex-1 overflow-y-auto"
    >

        {/* Chronic Conditions */}
        {medicalHistory.chronicConditions.length > 0 && (
          <div className="flex items-start gap-3">
            <Icon name="health" className="w-5 h-5 text-gray-400 mt-1 shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Chronic Conditions</div>
              <div className="flex flex-wrap gap-2">
                {medicalHistory.chronicConditions.map((condition: string, index: number) => (
                  <Badge key={index} variant="chronic-condition" size="sm">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Current Medications */}
        {medicalHistory.currentMedications.length > 0 && (
          <div className="flex items-start gap-3">
            <Icon name="medicine" className="w-5 h-5 text-gray-400 mt-1 shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Current Medications</div>
              <div className="flex flex-wrap gap-2">
                {medicalHistory.currentMedications.map((medication: string, index: number) => (
                  <Badge key={index} variant="medication" size="sm">
                    {medication}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Allergies */}
        {medicalHistory.allergies.length > 0 && (
          <div className="flex items-start gap-3">
            <Icon name="warning" className="w-5 h-5 text-orange-400 mt-1 shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Allergies</div>
              <div className="flex flex-wrap gap-2">
                {medicalHistory.allergies.map((allergy: string, index: number) => (
                  <Badge key={index} variant="allergy" size="sm">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Previous Surgeries */}
        {medicalHistory.previousSurgeries.length > 0 && (
          <div className="flex items-start gap-3">
            <Icon name="medical-kit" className="w-5 h-5 text-gray-400 mt-1 shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Previous Surgeries</div>
              <div className="flex flex-wrap gap-2">
                {medicalHistory.previousSurgeries.map((surgery: string, index: number) => (
                  <Badge key={index} variant="surgery" size="sm">
                    {surgery}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Family History */}
        {medicalHistory.familyHistory && (
          <div className="flex items-start gap-3">
            <Icon name="users-group" className="w-5 h-5 text-gray-400 mt-1 shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Family History</div>
              <div className="text-sm text-gray-900">{medicalHistory.familyHistory}</div>
            </div>
          </div>
        )}

        {/* Lifestyle */}
        <div className="flex items-start gap-3">
          <div className="text-gray-400 mt-1 shrink-0" style={{ width: 20, height: 20 }} />
          <div className="flex-1">
            <div className="text-xs text-gray-600 mb-2">Lifestyle</div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Icon name="health" className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-700">
                  Smoking: {medicalHistory.lifestyle.smoking ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="health" className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-700">
                  Alcohol: {medicalHistory.lifestyle.alcohol ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {medicalHistory.chronicConditions.length === 0 &&
          medicalHistory.currentMedications.length === 0 &&
          medicalHistory.allergies.length === 0 &&
          medicalHistory.previousSurgeries.length === 0 &&
          !medicalHistory.familyHistory && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No medical history recorded
            </div>
          )}
    </SectionContainer>
  );
};

// ============================================================================
// OrderHistoryCard Component
// ============================================================================

interface OrderHistoryCardProps {
  orders: Order[];
  onCreateOrder: () => void;
  onViewAllOrders: () => void;
  onOrderClick: (orderId: string) => void;
}

export const OrderHistoryCard: React.FC<OrderHistoryCardProps> = ({
  orders,
  onCreateOrder,
  onViewAllOrders,
  onOrderClick,
}) => {
  // Custom header content with buttons
  const headerContent = (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={onViewAllOrders}
        className="flex items-center gap-2 text-xs"
      >
        <Icon name="eye" className="w-3.5 h-3.5" />
        View All
      </Button>
      <Button
        size="sm"
        onClick={onCreateOrder}
        className="flex items-center gap-2 text-xs"
      >
        <Icon name="plus" className="w-3.5 h-3.5" />
        New Order
      </Button>
    </div>
  );

  return (
    <SectionContainer 
      title="Order History"
      headerRight={headerContent}
      className="h-full flex flex-col"
      contentClassName="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto"
    >
      {/* Order count */}
      <div className="text-xs text-gray-500 -mt-2 mb-2">
        {orders.length} order(s) found
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto min-h-0">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icon name="document" className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium mb-2">No orders found</p>
              <p className="text-sm text-gray-500 mb-4">Create a new order for this patient</p>
              <Button size="sm" variant="create" onClick={onCreateOrder}>
                Create Order
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 10).map((order) => (
                <div
                  key={order.orderId}
                  onClick={() => onOrderClick(order.orderId)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-sky-500 hover:bg-sky-50/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{order.orderId}</span>
                        <Badge variant={order.overallStatus} size="sm" />
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatDate(order.orderDate)} • {order.tests.length} test(s)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sky-600 text-sm">
                        {formatCurrency(order.totalPrice)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.paymentStatus.replace('-', ' ')}
                      </div>
                    </div>
                  </div>
                  {order.referringPhysician && (
                    <div className="text-xs text-gray-500 mt-2">
                      Referring Physician: {order.referringPhysician}
                    </div>
                  )}
                </div>
              ))}
              {orders.length > 10 && (
                <div className="text-center pt-2">
                  <Button variant="view" size="sm" onClick={onViewAllOrders}>
                    View All {orders.length} Orders
                  </Button>
                </div>
              )}
            </div>
          )}
      </div>
    </SectionContainer>
  );
};
