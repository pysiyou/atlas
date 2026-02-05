import React, { useEffect, useRef, useState } from 'react';
import { Avatar, Icon } from '@/shared/ui';
import { cn, displayId } from '@/utils';
import { inputContainerBase, inputContainerError } from '@/shared/ui/forms/inputStyles';
import type { Patient } from '@/types';
import { ICONS } from '@/utils';
import { getBadgeAppearance } from '@/shared/theme/theme';
import { TAG_STYLES } from '@/shared/ui/display/badge-colors';

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
  const appearance = getBadgeAppearance();
  const tagStyles = TAG_STYLES[appearance];

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-1 gap-2">
        <label
          htmlFor="order-patient-search"
          className="text-xs font-medium text-fg-subtle cursor-pointer truncate min-w-0"
        >
          Patient
        </label>
      </div>

      <div
        className={cn(
          inputContainerBase,
          'group relative pl-10 pr-3 py-2.5 flex flex-wrap gap-2 items-center min-h-[42px]',
          disabled && 'bg-canvas opacity-60 cursor-not-allowed',
          error && inputContainerError
        )}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon name={ICONS.dataFields.user} className="w-4 h-4 text-fg-faint group-hover:text-brand transition-colors" />
        </div>

        {selectedPatient && (
          <div className={`flex items-center gap-2 px-2 py-1 rounded max-w-full shrink-0 ${tagStyles.container}`}>
            <Avatar
              primaryText={selectedPatient.fullName}
              size="xxs"
              avatarOnly={true}
              className="shrink-0"
            />
            <span className={`text-xs font-medium truncate min-w-0 ${tagStyles.text}`}>
              {selectedPatient.fullName}
            </span>
            <span className={`text-xxs font-semibold font-mono shrink-0 ${tagStyles.code}`}>
              {displayId.patient(selectedPatient.id)}
            </span>
            {!disabled && (
              <button
                type="button"
                onClick={onClearSelection}
                className="flex items-center justify-center ml-0.5 -mr-0.5 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-brand/30 shrink-0"
                aria-label="Clear selected patient"
              >
                <Icon name={ICONS.actions.closeCircle} className={`w-3 h-3 ${tagStyles.remove}`} />
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
          className="flex-1 min-w-[140px] outline-none text-xs text-fg placeholder:text-fg-faint bg-transparent leading-normal"
          autoComplete="off"
          disabled={disabled}
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-danger-fg">{error}</p>}
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
            'border border-stroke/80',
            'rounded',
            'bg-panel',
            'shadow-lg shadow-md',
            'ring-1 ring-black/5',
          ].join(' ')}
        >
          {visiblePatients.length === 0 ? (
            <div className="px-4 py-3 text-xs text-fg-subtle">No patients found</div>
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
                        'hover:bg-canvas',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-opacity-30',
                        isSelected ? 'bg-success-bg' : 'bg-panel',
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
                        <span className="text-xs font-medium text-fg truncate">
                          {patient.fullName}
                        </span>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {/* Patient ID on the right */}
                        <span className="text-[11px] font-semibold font-mono text-brand">
                          {displayId.patient(patient.id)}
                        </span>
                        {/* Check icon if selected */}
                        {isSelected && (
                          <Icon name={ICONS.actions.checkCircle} className="w-5 h-5 text-success-text" />
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
