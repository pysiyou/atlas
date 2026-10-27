import React, { useEffect, useRef, useState } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { Icon, RemovableTag, TagChip } from '@/components/primitives';
import { Input } from '@/components/inputs';
import { EMPTY_COPY } from '@/components/display';
import { cn, formatPhoneNumber } from '@/utils';
import {
  text,
  inputContainerBase,
  inputContainerError,
  FORM_CONTROL_LABEL,
  FG,
  CONTROL,
  FIELD_ERROR,
  SPACING,
} from '@/theme/recipes';
import { ICONS } from '@/config/icons';
import { SearchResultsPopoverShell } from '@/components/overlays/SearchResultsPopoverShell';
import type { OrderFormInput } from '@/features/orders/schemas/order.schema';
import {
  type ReferentDoctor,
  useCreateReferentDoctor,
  useReferentDoctorSearch,
} from '../api/referentDoctors';

function formatDoctorMetaLine(doctor: ReferentDoctor): string {
  return [
    doctor.username?.trim() ? `@${doctor.username.trim()}` : undefined,
    doctor.hospitalName?.trim() || undefined,
    doctor.phone?.trim() ? formatPhoneNumber(doctor.phone) : undefined,
    doctor.email?.trim() || undefined,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' · ');
}

interface ReferentDoctorSelectProps {
  control: Control<OrderFormInput>;
  selectedDoctor: ReferentDoctor | null;
  onSelectDoctor: (doctor: ReferentDoctor) => void;
  onClearSelection: () => void;
  disabled?: boolean;
}

export const ReferentDoctorSelect: React.FC<ReferentDoctorSelectProps> = ({
  control,
  selectedDoctor,
  onSelectDoctor,
  onClearSelection,
  disabled = false,
}) => {
  const [search, setSearch] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newHospital, setNewHospital] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { results, isLoading } = useReferentDoctorSearch(search);
  const createDoctor = useCreateReferentDoctor();

  const trimmedSearch = search.trim();
  const canCreate =
    trimmedSearch.length >= 2 &&
    !results.some(d => d.fullName.toLowerCase() === trimmedSearch.toLowerCase());

  const visibleResults =
    trimmedSearch.length > 0 ? results : isPopoverOpen ? results : [];

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

  const resetNewDoctorFields = () => {
    setNewUsername('');
    setNewEmail('');
    setNewPhone('');
    setNewHospital('');
  };

  const handleCreate = async () => {
    if (!canCreate || createDoctor.isPending) return;
    const created = await createDoctor.mutateAsync({
      fullName: trimmedSearch,
      username: newUsername.trim() || null,
      email: newEmail.trim() || null,
      phone: newPhone.trim() || null,
      hospitalName: newHospital.trim() || null,
    });
    onSelectDoctor(created);
    setSearch('');
    resetNewDoctorFields();
    setIsPopoverOpen(false);
  };

  const selectedMeta = selectedDoctor ? formatDoctorMetaLine(selectedDoctor) : '';

  return (
    <Controller
      name="referentDoctorId"
      control={control}
      render={({ fieldState }) => (
        <div ref={containerRef} className="relative w-full space-y-space-2">
          <div className="flex justify-between items-baseline mb-space-1 gap-space-2">
            <label htmlFor="order-referent-doctor-search" className={FORM_CONTROL_LABEL}>
              Referent doctor
            </label>
          </div>

          <div
            className={cn(
              inputContainerBase,
              `group relative ${SPACING.plSpace10} pr-space-3 py-space-2-5 flex flex-wrap gap-space-2 items-center ${CONTROL.heightMultiline}`,
              disabled && 'cursor-not-allowed',
              fieldState.error && inputContainerError
            )}
          >
            <div className="absolute inset-y-0 left-0 pl-space-3 flex items-center pointer-events-none">
              <Icon
                name={ICONS.dataFields.stethoscope}
                className={`w-4 h-4 ${FG.muted} group-hover:text-brand transition-colors`}
              />
            </div>

            {selectedDoctor &&
              (disabled ? (
                <TagChip size="xs" className="max-w-[min(100%,20rem)] items-start">
                  <div className="min-w-0 flex flex-col">
                    <span className={`${text({ role: 'body' })} font-normal truncate`}>
                      {selectedDoctor.fullName}
                    </span>
                    {selectedMeta ? (
                      <span className={`${text({ role: 'caption' })} font-normal truncate`}>
                        {selectedMeta}
                      </span>
                    ) : null}
                  </div>
                </TagChip>
              ) : (
                <RemovableTag
                  size="xs"
                  onRemove={() => {
                    onClearSelection();
                    setIsPopoverOpen(false);
                  }}
                  removeAriaLabel="Clear selected referent doctor"
                  className="max-w-[min(100%,20rem)] items-start"
                >
                  <div className="min-w-0 flex flex-col">
                    <span className={`${text({ role: 'body' })} font-normal truncate`}>
                      {selectedDoctor.fullName}
                    </span>
                    {selectedMeta ? (
                      <span className={`${text({ role: 'caption' })} font-normal truncate`}>
                        {selectedMeta}
                      </span>
                    ) : null}
                  </div>
                </RemovableTag>
              ))}

            <input
              id="order-referent-doctor-search"
              name="referentDoctorSearch"
              type="text"
              value={search}
              onChange={e => {
                if (disabled) return;
                setSearch(e.target.value);
                setIsPopoverOpen(true);
              }}
              onFocus={() => {
                if (!disabled) setIsPopoverOpen(true);
              }}
              placeholder={selectedDoctor ? '' : 'Search or add referent doctor…'}
              className={`flex-1 min-w-[140px] outline-none ${text({ role: 'body' })} placeholder:${FG.muted} bg-transparent leading-normal`}
              autoComplete="off"
              disabled={disabled}
            />
          </div>

          {canCreate && !disabled ? (
            <div className="grid gap-space-2 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                label="Username"
                name="referentDoctorUsername"
                icon={ICONS.dataFields.user}
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="e.g. j.smith"
              />
              <Input
                label="Hospital"
                name="referentDoctorHospital"
                icon={ICONS.dataFields.mapPin}
                value={newHospital}
                onChange={e => setNewHospital(e.target.value)}
                placeholder="Facility name"
              />
              <Input
                label="Phone"
                name="referentDoctorPhone"
                icon={ICONS.dataFields.phone}
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="Contact number"
              />
              <Input
                label="Email"
                name="referentDoctorEmail"
                icon={ICONS.dataFields.email}
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="email@hospital.org"
              />
            </div>
          ) : null}

          {fieldState.error && (
            <p className={`mt-space-1-5 ${FIELD_ERROR}`}>{fieldState.error.message}</p>
          )}

          {!disabled && isPopoverOpen && (
            <SearchResultsPopoverShell
              title="Referent doctors"
              resultCount={visibleResults.length + (canCreate ? 1 : 0)}
              emptyMessage={EMPTY_COPY.matchingPatients.title}
              emptyDescription={
                isLoading ? 'Searching…' : 'Type a name to search or add a new referent doctor.'
              }
              isEmpty={!isLoading && visibleResults.length === 0 && !canCreate}
            >
              {visibleResults.map(doctor => {
                const meta = formatDoctorMetaLine(doctor);
                return (
                  <button
                    key={doctor.referentDoctorId}
                    type="button"
                    className={cn(
                      'w-full text-left px-space-3 py-space-2 hover:bg-surface-page',
                      CONTROL.focusVisibleTight,
                      selectedDoctor?.referentDoctorId === doctor.referentDoctorId
                        ? 'bg-surface-page'
                        : 'bg-surface'
                    )}
                    onClick={() => {
                      onSelectDoctor(doctor);
                      setSearch('');
                      resetNewDoctorFields();
                      setIsPopoverOpen(false);
                    }}
                  >
                    <p className={`${text({ role: 'body' })} font-normal`}>{doctor.fullName}</p>
                    {meta ? (
                      <p className={`${text({ role: 'caption' })} font-normal ${FG.muted} truncate`}>
                        {meta}
                      </p>
                    ) : null}
                  </button>
                );
              })}
              {canCreate ? (
                <button
                  type="button"
                  className={cn(
                    'w-full text-left px-space-3 py-space-2 hover:bg-surface-page text-brand',
                    text({ role: 'body' }),
                    CONTROL.focusVisibleTight
                  )}
                  onClick={() => void handleCreate()}
                  disabled={createDoctor.isPending}
                >
                  Add &quot;{trimmedSearch}&quot;
                </button>
              ) : null}
            </SearchResultsPopoverShell>
          )}
        </div>
      )}
    />
  );
};
