import React, { useEffect, useRef, useState } from 'react';
import { Avatar, Icon } from '@/shared/ui';
import { displayId } from '@/utils/id-display';
import type { Patient } from '@/types';
import { ICONS } from '@/utils/icon-mappings';
import { semanticColors, brandColors } from '@/shared/design-system/tokens/colors';

interface PatientSelectorProps {
  selectedPatient: Patient | null;
  patientSearch: string;
  onPatientSearchChange: (value: string) => void;
  filteredPatients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onClearSelection: () => void;
  error?: string;
  disabled?: boolean;
}

/**
 * PatientSearchTagInput
 *
 * Mirrors the "tag in input" UX used for test selection:
 * - Selected patient is rendered with avatar, name, and ID
 * - User can type to search and change selection
 * - Clicking the X clears selection
 */
const PatientSearchTagInput: React.FC<{
  selectedPatient: Patient | null;
  value: string;
  onValueChange: (value: string) => void;
  onClearSelection: () => void;
  error?: string;
  disabled?: boolean;
}> = ({ selectedPatient, value, onValueChange, onClearSelection, error, disabled = false }) => {

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-1 gap-2">
        <label
          htmlFor="order-patient-search"
          className="text-xs font-medium text-gray-500 cursor-pointer truncate min-w-0"
        >
          Patient
        </label>
      </div>

      <div
        className={[
          'relative',
          'w-full pl-10 pr-3 py-2.5 border rounded',
          'bg-white transition-colors',
          disabled ? 'bg-gray-50 opacity-60 cursor-not-allowed' : '',
          !disabled && 'focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-transparent',
          error ? semanticColors.danger.inputBorder : 'border-gray-300',
          'flex flex-wrap gap-2 items-center',
          'min-h-[42px]',
        ].join(' ')}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon name={ICONS.dataFields.user} className="w-4 h-4 text-gray-400" />
        </div>

        {selectedPatient && (
          <div className={`flex items-center gap-2 px-2 py-1 rounded ${brandColors.primary.backgroundLight} border ${brandColors.primary.border} max-w-full shrink-0`}>
            {/* Small avatar with initial */}
            <Avatar
              primaryText={selectedPatient.fullName}
              size="xxs"
              avatarOnly={true}
              className="shrink-0"
            />
            {/* Patient name */}
            <span className="text-xs font-medium text-gray-900 truncate min-w-0">
              {selectedPatient.fullName}
            </span>
            {/* Patient ID */}
            <span className="text-xxs font-semibold font-mono text-gray-600 shrink-0">
              {displayId.patient(selectedPatient.id)}
            </span>
            {/* Clear button */}
            {!disabled && (
              <button
                type="button"
                onClick={onClearSelection}
                className="flex items-center justify-center ml-0.5 -mr-0.5 hover:bg-sky-100 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-sky-400 shrink-0"
                aria-label="Clear selected patient"
              >
                <Icon name={ICONS.actions.closeCircle} className="w-3 h-3 text-gray-500 hover:text-gray-700" />
              </button>
            )}
          </div>
        )}

        <input
          id="order-patient-search"
          name="patientSearch"
          type="text"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onValueChange(e.target.value)}
          onFocus={() => onValueChange(value)}
          placeholder={selectedPatient ? 'Search to change…' : 'Search by name, ID, or phone…'}
          className="flex-1 min-w-[140px] outline-none text-xs text-gray-900 placeholder:text-gray-300 bg-transparent leading-normal"
          autoComplete="off"
          disabled={disabled}
        />
      </div>

      {error && <p className={`mt-1.5 text-xs ${semanticColors.danger.errorText}`}>{error}</p>}
    </div>
  );
};

export const PatientSelect: React.FC<PatientSelectorProps> = ({
  selectedPatient,
  patientSearch,
  onPatientSearchChange,
  filteredPatients,
  onSelectPatient,
  onClearSelection,
  error,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const hasSearch = patientSearch.trim().length > 0;
  const visiblePatients = hasSearch ? filteredPatients : [];

  // Close popover on outside click and Escape.
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      const container = containerRef.current;
      if (!container || !target) return;
      if (!container.contains(target)) setIsPopoverOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPopoverOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <PatientSearchTagInput
        selectedPatient={selectedPatient}
        value={patientSearch}
        onValueChange={value => {
          if (!disabled) {
            onPatientSearchChange(value);
            setIsPopoverOpen(value.trim().length > 0);
          }
        }}
        onClearSelection={() => {
          if (!disabled) {
            onClearSelection();
            // Keep popover closed when clearing via tag; user can type to reopen.
            setIsPopoverOpen(false);
          }
        }}
        error={error}
        disabled={disabled}
      />

      {/* "Popover" results shown directly under the input */}
      {!disabled && isPopoverOpen && hasSearch && (
        <div
          className={[
            'mt-1',
            'border border-gray-200/80',
            'rounded',
            'bg-white',
            'shadow-lg shadow-gray-900/10',
            'ring-1 ring-black/5',
          ].join(' ')}
        >
          {visiblePatients.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-500">No patients found</div>
          ) : (
            <div className="max-h-[320px] overflow-y-auto p-2">
              <div className="space-y-1">
                {visiblePatients.map(patient => {
                  const isSelected = selectedPatient?.id === patient.id;
                  return (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        onSelectPatient(patient);
                        setIsPopoverOpen(false);
                      }}
                      className={[
                        'w-full text-left',
                        'px-3 py-2',
                        'rounded',
                        'transition-colors',
                        'flex items-center justify-between gap-3',
                        'hover:bg-gray-50',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30',
                        isSelected ? 'bg-emerald-50/50' : 'bg-white',
                      ].join(' ')}
                    >
                      <div className="min-w-0 flex items-center gap-2.5 flex-1">
                        {/* Small avatar with initial */}
                        <Avatar
                          primaryText={patient.fullName}
                          size="xxs"
                          avatarOnly={true}
                          className="shrink-0"
                        />
                        {/* Patient name */}
                        <span className="text-xs font-medium text-gray-900 truncate">
                          {patient.fullName}
                        </span>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {/* Patient ID on the right */}
                        <span className="text-[11px] font-semibold font-mono text-gray-600">
                          {displayId.patient(patient.id)}
                        </span>
                        {/* Check icon if selected */}
                        {isSelected && (
                          <Icon name={ICONS.actions.checkCircle} className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
