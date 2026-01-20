/**
 * PatientInfoCard - Displays comprehensive patient information
 */

import React from 'react';
import { SectionContainer, Badge } from '@/shared/ui';
import { User, Phone, Mail, MapPin, Shield, UserPlus, Calendar, Clock } from 'lucide-react';
import { formatDate, calculateAge, formatPhoneNumber } from '@/utils';
import type { Patient } from '@/types';
import { AFFILIATION_DURATION_OPTIONS } from '@/types';
import { isAffiliationActive } from '../usePatientForm';

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
          <User className="text-gray-400 mt-1" size={20} />
          <div className="flex-1">
            <div className="text-xs text-gray-600 mb-1">Patient ID</div>
            <div className="font-mono font-medium text-gray-900">{patient.id}</div>
          </div>
        </div>
        
        {/* Demographics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <User className="text-gray-400 mt-1" size={20} />
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Full Name</div>
              <div className="font-medium text-gray-900">{patient.fullName}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="text-gray-400 mt-1" size={20} />
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
            <Phone className="text-gray-400 mt-1" size={20} />
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Phone</div>
              <div className="font-medium text-gray-900">{formatPhoneNumber(patient.phone)}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="text-gray-400 mt-1" size={20} />
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-1">Email</div>
              <div className="font-medium text-gray-900">{patient.email || 'Not provided'}</div>
            </div>
          </div>

          <div className="flex items-start gap-3 md:col-span-2">
            <MapPin className="text-gray-400 mt-1" size={20} />
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
            <UserPlus className="text-gray-400 mt-1" size={20} />
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
            <Shield className="text-gray-400 mt-1" size={20} />
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
              <Calendar className="text-gray-400 mt-1" size={20} />
              <div className="flex-1">
                <div className="text-xs text-gray-600 mb-1">Registration Date</div>
                <div className="font-medium text-gray-900">{formatDate(patient.registrationDate)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Registered by: {patient.createdBy}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="text-gray-400 mt-1" size={20} />
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
