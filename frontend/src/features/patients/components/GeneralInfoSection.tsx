/**
 * GeneralInfoSection
 * Identity, contact, and emergency details in a two-column vertical flow.
 */

import React from 'react';
import type { Patient } from '@/types';
import { DescriptionItem } from '@/components/display';
import { calculateAge } from '@/utils';
import { formatPatientDetailDate, formatAddress, formatRelationship } from '../utils/patientFormatters';
import { ICONS } from '@/config/icons';
import { DescriptionColumns } from '@/components/display';

export interface GeneralInfoSectionProps {
  patient: Patient;
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
      <DescriptionColumns>
        <DescriptionItem
          icon={ICONS.dataFields.gender}
          label="Gender"
          value={<span className="capitalize">{patient.gender || 'N/A'}</span>}
          orientation="vertical"
        />
        <DescriptionItem
          icon={ICONS.dataFields.birthday}
          label="Birthday"
          value={formatPatientDetailDate(patient.dateOfBirth, 'long')}
          orientation="vertical"
        />
        <DescriptionItem
          icon={ICONS.dataFields.age}
          label="Age"
          value={ageLabel}
          orientation="vertical"
        />
        <DescriptionItem
          icon={ICONS.dataFields.phone}
          label="Phone Number"
          value={patient.phone || 'N/A'}
          orientation="vertical"
        />
        <DescriptionItem
          icon={ICONS.dataFields.email}
          label="Email"
          value={patient.email || 'N/A'}
          orientation="vertical"
        />
        <DescriptionItem
          icon={ICONS.dataFields.address}
          label="Address"
          value={formatAddress(patient.address)}
          orientation="vertical"
        />
        <DescriptionItem
          icon={ICONS.ui.usersGroup}
          label="Emergency Contact"
          value={contact?.fullName || 'N/A'}
          orientation="vertical"
        />
        <DescriptionItem
          icon={ICONS.ui.link}
          label="Emergency Relationship"
          value={formatRelationship(contact?.relationship)}
          orientation="vertical"
        />
        <DescriptionItem
          icon={ICONS.dataFields.phone}
          label="Emergency Phone"
          value={contact?.phone || 'N/A'}
          orientation="vertical"
        />
        {contact?.email ? (
          <DescriptionItem
            icon={ICONS.dataFields.email}
            label="Emergency Email"
            value={contact.email}
            orientation="vertical"
          />
        ) : null}
      </DescriptionColumns>
    </div>
  );
};
