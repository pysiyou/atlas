/**
 * PatientInfoSection Component
 * Displays comprehensive patient information including demographics and emergency contact
 */

import React from 'react';
import { SectionContainer, Badge, Icon } from '@/shared/ui';
import { formatDate, calculateAge, formatPhoneNumber } from '@/utils';
import { displayId } from '@/utils';
import type { Patient } from '@/types';
import { AFFILIATION_DURATION_OPTIONS, RELATIONSHIP_CONFIG } from '@/types';
import { usePatientService } from '../services/usePatientService';
import { ICONS } from '@/utils';

interface PatientInfoCardProps {
  patient: Patient;
}

/**
 * Helper to get affiliation duration label
 */
const getDurationLabel = (months: number): string => {
  const option = AFFILIATION_DURATION_OPTIONS.find(opt => opt.value === months);
  return option?.label || `${months} Months`;
};

/**
 * PatientInfoCard - Main patient information display
 */
export const PatientInfoCard: React.FC<PatientInfoCardProps> = ({ patient }) => {
  const { isAffiliationActive } = usePatientService();
  return (
    <SectionContainer
      title="Patient Information"
      className="h-full flex flex-col"
      contentClassName="flex flex-col gap-4 flex-1 overflow-y-auto"
    >
      {/* Patient ID Section */}
      <div className="flex items-start gap-3 pb-3 border-b border-stroke-strong">
        <Icon name={ICONS.dataFields.user} className="w-5 h-5 text-fg-disabled mt-1" />
        <div className="flex-1">
          <div className="text-xs text-fg-subtle mb-1">Patient ID</div>
          <div className="font-mono font-medium text-fg">{displayId.patient(patient.id)}</div>
        </div>
      </div>

      {/* Demographics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <Icon name={ICONS.dataFields.user} className="w-5 h-5 text-fg-disabled mt-1" />
          <div className="flex-1">
            <div className="text-xs text-fg-subtle mb-1">Full Name</div>
            <div className="font-medium text-fg">{patient.fullName}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Icon name={ICONS.dataFields.userHands} className="w-5 h-5 text-fg-disabled mt-1" />
          <div className="flex-1">
            <div className="text-xs text-fg-subtle mb-1">Age & Gender</div>
            <div className="font-medium text-fg">
              {calculateAge(patient.dateOfBirth)} years old •{' '}
              {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
            </div>
            <div className="text-xs text-fg-subtle mt-1">DOB: {formatDate(patient.dateOfBirth)}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Icon name={ICONS.dataFields.phone} className="w-5 h-5 text-fg-disabled mt-1" />
          <div className="flex-1">
            <div className="text-xs text-fg-subtle mb-1">Phone</div>
            <div className="font-medium text-fg">{formatPhoneNumber(patient.phone)}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Icon name={ICONS.dataFields.email} className="w-5 h-5 text-fg-disabled mt-1" />
          <div className="flex-1">
            <div className="text-xs text-fg-subtle mb-1">Email</div>
            <div className="font-medium text-fg">{patient.email || 'Not provided'}</div>
          </div>
        </div>

        <div className="flex items-start gap-3 md:col-span-2">
          <Icon name={ICONS.dataFields.mapPin} className="w-5 h-5 text-fg-disabled mt-1" />
          <div className="flex-1">
            <div className="text-xs text-fg-subtle mb-1">Address</div>
            <div className="font-medium text-fg">{patient.address.street}</div>
            <div className="text-xs text-fg-subtle mt-1">
              {patient.address.city}, {patient.address.postalCode}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact Section */}
      <div className="mt-4 pt-4 border-t border-stroke">
        <div className="flex items-start gap-3">
          <Icon name={ICONS.dataFields.userHands} className="w-5 h-5 text-fg-disabled mt-1" />
          <div className="flex-1">
            <div className="text-xs text-fg-subtle mb-2">Emergency Contact</div>
            <div className="font-medium text-fg">{patient.emergencyContact.fullName}</div>
            <div className="text-xs text-fg-subtle mt-1">
              {RELATIONSHIP_CONFIG[patient.emergencyContact.relationship]?.label ||
                patient.emergencyContact.relationship}
            </div>
            <div className="text-xs text-fg-subtle mt-1">
              {formatPhoneNumber(patient.emergencyContact.phone)}
            </div>
            {patient.emergencyContact.email && (
              <div className="text-xs text-fg-subtle mt-1">{patient.emergencyContact.email}</div>
            )}
          </div>
        </div>
      </div>

      {/* Lab Affiliation Section */}
      <div className="mt-4 pt-4 border-t border-stroke">
        <div className="flex items-start gap-3">
          <Icon name={ICONS.ui.shield} className="w-5 h-5 text-fg-disabled mt-1" />
          <div className="flex-1">
            <div className="text-xs text-fg-subtle mb-2">Lab Affiliation</div>
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
                <div className="text-xs text-fg-subtle">
                  Assurance #:{' '}
                  <span className="font-mono font-medium text-fg">
                    {patient.affiliation.assuranceNumber}
                  </span>
                </div>
                <div className="text-xs text-fg-subtle">
                  Duration:{' '}
                  <span className="font-medium text-fg">
                    {getDurationLabel(patient.affiliation.duration)}
                  </span>
                </div>
                <div className="text-xs text-fg-subtle">
                  Expires:{' '}
                  <span
                    className={`font-medium ${isAffiliationActive(patient.affiliation) ? 'text-fg' : 'text-danger-fg'}`}
                  >
                    {formatDate(patient.affiliation.endDate)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration & Metadata Section */}
      <div className="mt-4 pt-4 border-t border-stroke">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Icon name={ICONS.dataFields.date} className="w-5 h-5 text-fg-disabled mt-1" />
            <div className="flex-1">
              <div className="text-xs text-fg-subtle mb-1">Registration Date</div>
              <div className="font-medium text-fg">
                {formatDate(patient.registrationDate)}
              </div>
              <div className="text-xs text-fg-subtle mt-1">Registered by: {patient.createdBy}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Icon name={ICONS.dataFields.time} className="w-5 h-5 text-fg-disabled mt-1" />
            <div className="flex-1">
              <div className="text-xs text-fg-subtle mb-1">Last Updated</div>
              <div className="font-medium text-fg">{formatDate(patient.updatedAt)}</div>
              <div className="text-xs text-fg-subtle mt-1">Updated by: {patient.updatedBy}</div>
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
};
