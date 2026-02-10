/**
 * MedicalHistorySection Component
 * Displays patient medical history including conditions, medications, allergies, and surgeries
 */

import React from 'react';
import { SectionContainer, Badge, Icon, EmptyState } from '@/shared/ui';
import type { Patient } from '@/types';
import { formatFamilyHistory } from '../utils/patient-formatters';
import { DEFAULT_EMPTY_DESCRIPTION } from '@/shared/constants';
import { ICONS } from '@/utils';

interface MedicalHistoryCardProps {
  patient: Patient;
}

/**
 * MedicalHistoryCard - Displays comprehensive medical history
 */
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
          <Icon name={ICONS.dataFields.health} className="w-5 h-5 text-fg-disabled mt-1 shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-fg-subtle mb-1">Chronic Conditions</div>
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
          <Icon name={ICONS.dataFields.medicine} className="w-5 h-5 text-fg-disabled mt-1 shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-fg-subtle mb-1">Current Medications</div>
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
          <Icon name={ICONS.actions.warning} className="w-5 h-5 text-warning-text mt-1 shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-fg-subtle mb-1">Allergies</div>
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
          <Icon name={ICONS.dataFields.medicalKit} className="w-5 h-5 text-fg-disabled mt-1 shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-fg-subtle mb-1">Previous Surgeries</div>
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
      {formatFamilyHistory(medicalHistory.familyHistory) !== 'None' && (
        <div className="flex items-start gap-3">
          <Icon name={ICONS.ui.usersGroup} className="w-5 h-5 text-fg-disabled mt-1 shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-fg-subtle mb-1">Family History</div>
            <div className="text-sm text-fg">
              {formatFamilyHistory(medicalHistory.familyHistory)}
            </div>
          </div>
        </div>
      )}

      {/* Lifestyle */}
      <div className="flex items-start gap-3">
        <div className="text-fg-disabled mt-1 shrink-0" style={{ width: 20, height: 20 }} />
        <div className="flex-1">
          <div className="text-xs text-fg-subtle mb-2">Lifestyle</div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Icon name={ICONS.dataFields.health} className="w-4 h-4 text-fg-disabled" />
              <span className="text-xs text-fg-muted">
                Smoking: {medicalHistory.lifestyle.smoking ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name={ICONS.dataFields.health} className="w-4 h-4 text-fg-disabled" />
              <span className="text-xs text-fg-muted">
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
        formatFamilyHistory(medicalHistory.familyHistory) === 'None' && (
          <EmptyState
            icon={ICONS.dataFields.medicalKit}
            title="No medical history recorded"
            description={DEFAULT_EMPTY_DESCRIPTION}
          />
        )}
    </SectionContainer>
  );
};
