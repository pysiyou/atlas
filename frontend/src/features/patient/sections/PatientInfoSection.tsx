/**
 * PatientInfoSection Component
 * Displays comprehensive patient information including demographics and emergency contact
 */

import React from 'react';
import { SectionContainer, Badge, Icon } from '@/shared/ui';
import { formatDate, calculateAge, formatPhoneNumber } from '@/utils';
import { displayId } from '@/utils/id-display';
import type { Patient } from '@/types';
import { AFFILIATION_DURATION_OPTIONS, RELATIONSHIP_CONFIG } from '@/types';
import { isAffiliationActive } from '../utils/affiliationUtils';
import { ICONS } from '@/utils/icon-mappings';
import { semanticColors, neutralColors } from '@/shared/design-system/tokens/colors';
import { iconSizes } from '@/shared/design-system/tokens/sizing';
import { border } from '@/shared/design-system/tokens/borders';
import { fontSize } from '@/shared/design-system/tokens/typography';

// Token-based style constants for consistent styling
const styles = {
  iconBase: `${iconSizes.md} ${neutralColors.text.disabled} mt-1`,
  labelText: `${fontSize.xs} ${neutralColors.text.tertiary} mb-1`,
  labelTextMb2: `${fontSize.xs} ${neutralColors.text.tertiary} mb-2`,
  valueText: `font-medium ${neutralColors.text.primary}`,
  valueTextMono: `font-mono font-medium ${neutralColors.text.primary}`,
  secondaryText: `${fontSize.xs} ${neutralColors.text.muted} mt-1`,
  sectionDivider: `border-b ${border.divider}`,
  sectionDividerTop: `mt-4 pt-4 border-t ${border.default}`,
} as const;

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
  return (
    <SectionContainer
      title="Patient Information"
      className="h-full flex flex-col"
      contentClassName="flex flex-col gap-4 flex-1 overflow-y-auto"
    >
      {/* Patient ID Section */}
      <div className={`flex items-start gap-3 pb-3 ${styles.sectionDivider}`}>
        <Icon name={ICONS.dataFields.user} className={styles.iconBase} />
        <div className="flex-1">
          <div className={styles.labelText}>Patient ID</div>
          <div className={styles.valueTextMono}>{displayId.patient(patient.id)}</div>
        </div>
      </div>

      {/* Demographics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <Icon name={ICONS.dataFields.user} className={styles.iconBase} />
          <div className="flex-1">
            <div className={styles.labelText}>Full Name</div>
            <div className={styles.valueText}>{patient.fullName}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Icon name={ICONS.dataFields.userHands} className={styles.iconBase} />
          <div className="flex-1">
            <div className={styles.labelText}>Age & Gender</div>
            <div className={styles.valueText}>
              {calculateAge(patient.dateOfBirth)} years old •{' '}
              {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
            </div>
            <div className={styles.secondaryText}>DOB: {formatDate(patient.dateOfBirth)}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Icon name={ICONS.dataFields.phone} className={styles.iconBase} />
          <div className="flex-1">
            <div className={styles.labelText}>Phone</div>
            <div className={styles.valueText}>{formatPhoneNumber(patient.phone)}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Icon name={ICONS.dataFields.email} className={styles.iconBase} />
          <div className="flex-1">
            <div className={styles.labelText}>Email</div>
            <div className={styles.valueText}>{patient.email || 'Not provided'}</div>
          </div>
        </div>

        <div className="flex items-start gap-3 md:col-span-2">
          <Icon name={ICONS.dataFields.mapPin} className={styles.iconBase} />
          <div className="flex-1">
            <div className={styles.labelText}>Address</div>
            <div className={styles.valueText}>{patient.address.street}</div>
            <div className={styles.secondaryText}>
              {patient.address.city}, {patient.address.postalCode}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact Section */}
      <div className={styles.sectionDividerTop}>
        <div className="flex items-start gap-3">
          <Icon name={ICONS.dataFields.userHands} className={styles.iconBase} />
          <div className="flex-1">
            <div className={styles.labelTextMb2}>Emergency Contact</div>
            <div className={styles.valueText}>{patient.emergencyContact.fullName}</div>
            <div className={styles.secondaryText}>
              {RELATIONSHIP_CONFIG[patient.emergencyContact.relationship]?.label ||
                patient.emergencyContact.relationship}
            </div>
            <div className={styles.secondaryText}>
              {formatPhoneNumber(patient.emergencyContact.phone)}
            </div>
            {patient.emergencyContact.email && (
              <div className={styles.secondaryText}>{patient.emergencyContact.email}</div>
            )}
          </div>
        </div>
      </div>

      {/* Lab Affiliation Section */}
      <div className={styles.sectionDividerTop}>
        <div className="flex items-start gap-3">
          <Icon name={ICONS.ui.shield} className={styles.iconBase} />
          <div className="flex-1">
            <div className={styles.labelTextMb2}>Lab Affiliation</div>
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
                <div className={`${fontSize.xs} ${neutralColors.text.muted}`}>
                  Assurance #:{' '}
                  <span className={styles.valueTextMono}>
                    {patient.affiliation.assuranceNumber}
                  </span>
                </div>
                <div className={`${fontSize.xs} ${neutralColors.text.muted}`}>
                  Duration:{' '}
                  <span className={styles.valueText}>
                    {getDurationLabel(patient.affiliation.duration)}
                  </span>
                </div>
                <div className={`${fontSize.xs} ${neutralColors.text.muted}`}>
                  Expires:{' '}
                  <span
                    className={`font-medium ${isAffiliationActive(patient.affiliation) ? neutralColors.text.primary : semanticColors.danger.icon}`}
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
      <div className={styles.sectionDividerTop}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Icon name={ICONS.dataFields.date} className={styles.iconBase} />
            <div className="flex-1">
              <div className={styles.labelText}>Registration Date</div>
              <div className={styles.valueText}>
                {formatDate(patient.registrationDate)}
              </div>
              <div className={styles.secondaryText}>Registered by: {patient.createdBy}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Icon name={ICONS.dataFields.time} className={styles.iconBase} />
            <div className="flex-1">
              <div className={styles.labelText}>Last Updated</div>
              <div className={styles.valueText}>{formatDate(patient.updatedAt)}</div>
              <div className={styles.secondaryText}>Updated by: {patient.updatedBy}</div>
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
};
