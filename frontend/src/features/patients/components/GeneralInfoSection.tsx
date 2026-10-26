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

/** Core identity and contact fields (order detail top section). */
export function renderPatientBasicInfoDescriptionItems(patient: Patient): React.ReactElement[] {
  const age = patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null;
  const ageLabel = age == null || !Number.isFinite(age) ? 'N/A' : `${age} years`;

  return [
    <DescriptionItem
      key="gender"
      icon={ICONS.dataFields.gender}
      label="Gender"
      value={<span className="capitalize">{patient.gender || 'N/A'}</span>}
      orientation="vertical"
    />,
    <DescriptionItem
      key="birthday"
      icon={ICONS.dataFields.birthday}
      label="Birthday"
      value={formatPatientDetailDate(patient.dateOfBirth, 'long')}
      orientation="vertical"
    />,
    <DescriptionItem
      key="age"
      icon={ICONS.dataFields.age}
      label="Age"
      value={ageLabel}
      orientation="vertical"
    />,
    <DescriptionItem
      key="phone"
      icon={ICONS.dataFields.phone}
      label="Phone Number"
      value={patient.phone || 'N/A'}
      orientation="vertical"
    />,
    <DescriptionItem
      key="email"
      icon={ICONS.dataFields.email}
      label="Email"
      value={patient.email || 'N/A'}
      orientation="vertical"
    />,
    <DescriptionItem
      key="address"
      icon={ICONS.dataFields.address}
      label="Address"
      value={formatAddress(patient.address)}
      orientation="vertical"
    />,
  ];
}

export function renderPatientEmergencyContactDescriptionItems(patient: Patient): React.ReactElement[] {
  const contact = patient.emergencyContact;
  const items: React.ReactElement[] = [
    <DescriptionItem
      key="emergency-contact"
      icon={ICONS.ui.usersGroup}
      label="Emergency Contact"
      value={contact?.fullName || 'N/A'}
      orientation="vertical"
    />,
    <DescriptionItem
      key="emergency-relationship"
      icon={ICONS.ui.link}
      label="Emergency Relationship"
      value={formatRelationship(contact?.relationship)}
      orientation="vertical"
    />,
    <DescriptionItem
      key="emergency-phone"
      icon={ICONS.dataFields.phone}
      label="Emergency Phone"
      value={contact?.phone || 'N/A'}
      orientation="vertical"
    />,
  ];

  if (contact?.email) {
    items.push(
      <DescriptionItem
        key="emergency-email"
        icon={ICONS.dataFields.email}
        label="Emergency Email"
        value={contact.email}
        orientation="vertical"
      />
    );
  }

  return items;
}

/** Description fields for general patient identity and contact (shared with order detail). */
export function renderGeneralInfoDescriptionItems(patient: Patient): React.ReactElement[] {
  return [
    ...renderPatientBasicInfoDescriptionItems(patient),
    ...renderPatientEmergencyContactDescriptionItems(patient),
  ];
}

/**
 * Displays who the patient is and how to reach them.
 * Body measurements live on the care snapshot, next to vitals and BMI.
 */
export const GeneralInfoSection: React.FC<GeneralInfoSectionProps> = ({ patient }) => {
  return (
    <div className="flex min-h-0 h-full flex-col">
      <DescriptionColumns>{renderGeneralInfoDescriptionItems(patient)}</DescriptionColumns>
    </div>
  );
};
