import React, { useRef, useState } from 'react';
import { Avatar, RemovableTag, TagChip } from '@/components/primitives';
import { EMPTY_COPY } from '@/components/display';
import { cn, formatPhoneNumber } from '@/utils';
import { text, FG } from '@/theme/recipes';
import type { Patient } from '@/types';
import { IconKeys } from '@/config/icons';
import { SearchResultsPopoverShell } from '@/components/overlays/SearchResultsPopoverShell';
import {
  SearchTagInputChrome,
  SELECTED_SEARCH_CHIP_CLASS,
} from '@/components/overlays/SearchTagInputChrome';
import { CONTROL } from '@/theme/recipes';
import { useAnchoredPopoverDismiss } from '@/hooks';

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
        <span className={`${text({ role: 'body' })} font-normal truncate capitalize`}>
          {patient.fullName}
        </span>
        <span className={`${text({ role: 'caption' })} font-normal truncate`}>
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
  <SearchTagInputChrome
    label="Patient"
    htmlFor="order-patient-search"
    iconKey={IconKeys.dataFields.user}
    error={error}
    disabled={disabled}
  >
    {selectedPatient &&
      (disabled ? (
        <TagChip size="xs" className={SELECTED_SEARCH_CHIP_CLASS}>
          <PatientSelectedChip patient={selectedPatient} />
        </TagChip>
      ) : (
        <RemovableTag
          size="xs"
          onRemove={onClearSelection}
          removeAriaLabel="Clear selected patient"
          className={SELECTED_SEARCH_CHIP_CLASS}
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
      className={`flex-1 min-w-[140px] outline-none ${text({ role: 'body' })} placeholder:${FG.muted} bg-transparent leading-normal`}
      autoComplete="off"
      disabled={disabled}
    />
  </SearchTagInputChrome>
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
  useAnchoredPopoverDismiss(containerRef, setIsPopoverOpen);

  const hasSearch = patientSearch.trim().length > 0;
  const visiblePatients = hasSearch ? filteredPatients : [];

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
        <SearchResultsPopoverShell
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
                        'transition-colors cursor-pointer flex items-center gap-space-2',
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
                        <p className={`${text({ role: 'body' })} font-normal truncate capitalize`}>
                          {patient.fullName}
                        </p>
                        {contactLine ? (
                          <p className={`${text({ role: 'caption' })} truncate`}>{contactLine}</p>
                        ) : (
                          <p className={`${text({ role: 'caption' })} ${FG.muted} truncate`}>No contact on file</p>
                        )}
                      </div>
                    </button>
                  );
          })}
        </SearchResultsPopoverShell>
      )}
    </div>
  );
};
