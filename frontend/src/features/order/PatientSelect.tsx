import React from 'react';
import { SectionContainer, Button, SearchBar } from '@/shared/ui';
import type { Patient } from '@/types';

interface PatientSelectorProps {
  selectedPatient: Patient | null;
  patientSearch: string;
  onPatientSearchChange: (value: string) => void;
  filteredPatients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onClearSelection: () => void;
  error?: string;
}

export const PatientSelect: React.FC<PatientSelectorProps> = ({
  selectedPatient,
  patientSearch,
  onPatientSearchChange,
  filteredPatients,
  onSelectPatient,
  onClearSelection,
  error,
}) => {
  return (
    <SectionContainer title="Patient Selection">
      {selectedPatient ? (
        <div className="flex items-center justify-between p-4 bg-sky-50 rounded">
          <div>
            <div className="font-medium text-gray-900">{selectedPatient.fullName}</div>
            <div className="text-sm text-gray-600">
              {selectedPatient.id} • {selectedPatient.phone}
            </div>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={onClearSelection}>
            Change Patient
          </Button>
        </div>
      ) : (
        <div>
          <SearchBar
            placeholder="Search by name, ID, or phone..."
            value={patientSearch}
            onChange={(e) => onPatientSearchChange(e.target.value)}
          />

          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

          {patientSearch && filteredPatients.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded divide-y">
              {filteredPatients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => onSelectPatient(patient)}
                  className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{patient.fullName}</div>
                  <div className="text-sm text-gray-600">
                    {patient.id} • {patient.phone}
                  </div>
                </button>
              ))}
            </div>
          )}

          {patientSearch && filteredPatients.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">No patients found</p>
          )}
        </div>
      )}
    </SectionContainer>
  );
};
