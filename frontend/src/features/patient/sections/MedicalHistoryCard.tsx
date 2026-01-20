/**
 * MedicalHistoryCard - Displays patient medical history
 */

import React from 'react';
import { SectionContainer, Badge } from '@/shared/ui';
import { Activity, Pill, AlertTriangle, Scissors, Users, Cigarette, Wine } from 'lucide-react';
import type { Patient } from '@/types';

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
            <Activity className="text-gray-400 mt-1 shrink-0" size={20} />
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
            <Pill className="text-gray-400 mt-1 shrink-0" size={20} />
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
            <AlertTriangle className="text-orange-400 mt-1 shrink-0" size={20} />
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
            <Scissors className="text-gray-400 mt-1 shrink-0" size={20} />
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
            <Users className="text-gray-400 mt-1 shrink-0" size={20} />
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Family History</div>
              <div className="text-sm text-gray-900">{medicalHistory.familyHistory}</div>
            </div>
          </div>
        )}

        {/* Lifestyle */}
        <div className="flex items-start gap-3">
          <div className="text-gray-400 mt-1 shrink-0 w-5 h-5" />
          <div className="flex-1">
            <div className="text-xs text-gray-600 mb-2">Lifestyle</div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Cigarette className="text-gray-400" size={16} />
                <span className="text-xs text-gray-700">
                  Smoking: {medicalHistory.lifestyle.smoking ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Wine className="text-gray-400" size={16} />
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
