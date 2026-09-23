/**
 * GeneralInfoSection
 * Identity, contact, and emergency details in a two-column vertical flow.
 */

import React from 'react';
import type { Patient } from '@/types';
import { DetailField } from '@/components/display/DetailField';
import { calculateAge } from '@/utils';
import { formatPatientDetailDate, formatAddress, formatRelationship } from '../utils/patientFormatters';
import { ICONS } from '@/config/icons';
import { DetailFieldsColumnFlow } from './DetailFieldsColumnFlow';

export interface GeneralInfoSectionProps {
  patient: Patient;
  /** @deprecated Layout is fixed; kept for parent call sites. */
  layout?: 'grid' | 'column';
}

/**
 * Displays who the patient is and how to reach them.
 * Body measurements live on the care snapshot, next to vitals and BMI.
 */
export const GeneralInfoSection: React.FC<GeneralInfoSectionProps> = ({ patient }) => {
  const contact = patient.emergencyContact;
  const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null;
  const ageLabel = age == null || !Number.isFinite(age) ? 'N/A' : `${age} years`;

  return (
    <div className="flex min-h-0 h-full flex-col">
      <DetailFieldsColumnFlow>
        <DetailField
          icon={ICONS.dataFields.gender}
          label="Gender"
          value={<span className="capitalize">{patient.gender || 'N/A'}</span>}
          orientation="vertical"
        />
        <DetailField
          icon={ICONS.dataFields.birthday}
          label="Birthday"
          value={formatPatientDetailDate(patient.dateOfBirth, 'long')}
          orientation="vertical"
        />
        <DetailField
          icon={ICONS.dataFields.age}
          label="Age"
          value={ageLabel}
          orientation="vertical"
        />
        <DetailField
          icon={ICONS.dataFields.phone}
          label="Phone Number"
          value={patient.phone || 'N/A'}
          orientation="vertical"
        />
        <DetailField
          icon={ICONS.dataFields.email}
          label="Email"
          value={patient.email || 'N/A'}
          orientation="vertical"
        />
        <DetailField
          icon={ICONS.dataFields.address}
          label="Address"
          value={formatAddress(patient.address)}
          orientation="vertical"
        />
        <DetailField
          icon={ICONS.ui.usersGroup}
          label="Emergency Contact"
          value={contact?.fullName || 'N/A'}
          orientation="vertical"
        />
        <DetailField
          icon={ICONS.ui.link}
          label="Emergency Relationship"
          value={formatRelationship(contact?.relationship)}
          orientation="vertical"
        />
        <DetailField
          icon={ICONS.dataFields.phone}
          label="Emergency Phone"
          value={contact?.phone || 'N/A'}
          orientation="vertical"
        />
        {contact?.email ? (
          <DetailField
            icon={ICONS.dataFields.email}
            label="Emergency Email"
            value={contact.email}
            orientation="vertical"
          />
        ) : null}
      </DetailFieldsColumnFlow>
    </div>
  );
};
