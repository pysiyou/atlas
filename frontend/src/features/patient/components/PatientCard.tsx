import { useModal, ModalType } from '@/shared/context/ModalContext';
import { Badge, Avatar, IconButton } from '@/shared/ui';
import type { CardComponentProps } from '@/shared/ui/Table';
import { calculateAge, formatPhoneNumber } from '@/utils';
import { displayId } from '@/utils';
import type { Patient } from '@/types';

/**
 * PatientCard Component
 *
 * Custom mobile card component for patient data.
 * Displays patient information in a mobile-friendly card layout.
 *
 * @param item - Patient data
 * @param index - Index of the patient in the list
 * @param onClick - Optional click handler
 */
export function PatientCard({ item: patient, onClick }: CardComponentProps<Patient>) {
  const { openModal } = useModal();

  const handleAddOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    openModal(ModalType.NEW_ORDER, { patientId: patient.id.toString() });
  };

  return (
    <div
      onClick={onClick}
      className="bg-panel border border-stroke rounded-md p-3 duration-200 cursor-pointer flex flex-col h-full"
    >
      {/* Header: Avatar (top left) + Gender badge (top right) */}
      <div className="flex justify-between items-start mb-3 pb-3 border-b border-stroke">
        {/* Avatar: Patient name + Patient ID - positioned at top left */}
        <Avatar
          primaryText={patient.fullName}
          primaryTextClassName=""
          secondaryText={displayId.patient(patient.id)}
          secondaryTextClassName="font-mono text-brand"
          size="xs"
        />
        {/* Gender badge on top right */}
        <Badge variant={patient.gender} size="xs" />
      </div>

      {/* Contact info: Age, Phone, email */}
      <div className="grow pt-1">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {/* Age */}
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
            <span className="text-xs text-fg-muted truncate">
              {calculateAge(patient.dateOfBirth)} years old
            </span>
          </div>
          
          {/* Phone */}
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
            <span className="text-xs text-fg-muted truncate">
              {formatPhoneNumber(patient.phone)}
            </span>
          </div>
          
          {/* Email */}
          {patient.email && (
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
              <span className="text-xs text-fg-muted truncate">
                {patient.email}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom section: Add Order button - positioned at bottom right */}
      <div className="flex justify-between items-center mt-auto pt-3">
        <div></div>
        <IconButton variant="add" size="sm" title="Add Order" onClick={handleAddOrder} />
      </div>
    </div>
  );
}
