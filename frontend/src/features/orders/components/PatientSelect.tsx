import React, { useEffect, useRef, useState } from 'react';
import { Avatar, EMPTY_COPY, Icon, RemovableTag, TagChip } from '@/components';
import { cn, formatPhoneNumber } from '@/utils';
import { inputContainerBase, inputContainerError, FORM_CONTROL_LABEL } from '@/components/inputs/inputStyles';
import type { Patient } from '@/types';
import { ICONS } from '@/config/icons';
import { OrderSelectPopoverShell } from './OrderSelectPopoverShell';
import { CONTROL, FIELD_ERROR, SPACING, TYPE } from '@/components/theme/recipes';


const SELECTED_CHIP_CLASS =
  'max-w-[min(100%,20rem)] items-start gap-space-2 py-space-1-5 px-space-2 bg-surface-page border-border-default/80 shadow-none';

function formatPatientContactLine(patient: Patient): string {
  return [
    patient.email?.trim() || undefined,
    patient.phone?.trim() ? formatPhoneNumber(patient.phone) : undefined,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' · ');
}

function PatientSelectedChip({ patient }: { patient: Patient }) {
  const contactLine = formatPatientContactLine(patient);
  return (
    <>
      <Avatar
        primaryText={patient.fullName}
        size="xs"
        avatarOnly
        className="shrink-0 self-center"
      />
      <div className="min-w-0 flex flex-col">
        <span className={`${TYPE.value} font-normal truncate capitalize`}>
          {patient.fullName}
        </span>
        <span className={`${TYPE.caption} font-normal truncate`}>
          {contactLine || 'No contact on file'}
        </span>
      </div>
    </>
  );
}

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
}> = ({ selectedPatient, value, onValueChange, onClearSelection, error, disabled = false }) => (
  <div className="w-full">
      <div className="flex justify-between items-baseline mb-space-1 gap-space-2">
        <label
          htmlFor="order-patient-search"
          className={FORM_CONTROL_LABEL}
        >
          Patient
        </label>
      </div>

      <div
        className={cn(
          inputContainerBase,
          `group relative ${SPACING.plSpace10} pr-space-3 py-space-2-5 flex flex-wrap gap-space-2 items-center ${CONTROL.heightMultiline}`,
          disabled && 'cursor-not-allowed',
          error && inputContainerError
        )}
      >
        <div className="absolute inset-y-0 left-0 pl-space-3 flex items-center pointer-events-none">
          <Icon
            name={ICONS.dataFields.user}
            className="w-4 h-4 text-text-muted group-hover:text-brand transition-colors"
          />
        </div>

        {selectedPatient &&
          (disabled ? (
            <TagChip size="xs" className={SELECTED_CHIP_CLASS}>
              <PatientSelectedChip patient={selectedPatient} />
            </TagChip>
          ) : (
            <RemovableTag
              size="xs"
              onRemove={onClearSelection}
              removeAriaLabel="Clear selected patient"
              className={SELECTED_CHIP_CLASS}
            >
              <PatientSelectedChip patient={selectedPatient} />
            </RemovableTag>
          ))}

        <input
          id="order-patient-search"
          name="patientSearch"
          type="text"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onValueChange(e.target.value)}
          onFocus={() => onValueChange(value)}
          placeholder={selectedPatient ? '' : 'Search by name, ID, or phone…'}
          className={`flex-1 min-w-[140px] outline-none ${TYPE.value} placeholder:text-text-muted bg-transparent leading-normal`}
          autoComplete="off"
          disabled={disabled}
        />
      </div>

      {error && <p className={`mt-space-1-5 ${FIELD_ERROR}`}>{error}</p>}
    </div>
  );

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
        <OrderSelectPopoverShell
          title="Matching patients"
          resultCount={visiblePatients.length}
          emptyMessage={EMPTY_COPY.matchingPatients.title}
          emptyDescription={EMPTY_COPY.matchingPatients.description}
          isEmpty={visiblePatients.length === 0}
        >
          {visiblePatients.map(patient => {
                  const isSelected = selectedPatient?.id === patient.id;
                  const contactLine = formatPatientContactLine(patient);

                  return (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        onSelectPatient(patient);
                        setIsPopoverOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-space-3 py-space-2',
                        'transition-colors flex items-center gap-space-2',
                        'hover:bg-surface-page',
                        `${CONTROL.focusVisibleTight}`,
                        isSelected ? 'bg-surface-page' : 'bg-surface'
                      )}
                    >
                      <Avatar
                        primaryText={patient.fullName}
                        size="xs"
                        avatarOnly
                        className="shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`${TYPE.value} font-normal truncate capitalize`}>
                          {patient.fullName}
                        </p>
                        {contactLine ? (
                          <p className={`${TYPE.caption} truncate`}>{contactLine}</p>
                        ) : (
                          <p className={`${TYPE.caption} text-text-muted truncate`}>No contact on file</p>
                        )}
                      </div>
                    </button>
                  );
          })}
        </OrderSelectPopoverShell>
      )}
    </div>
  );
};
