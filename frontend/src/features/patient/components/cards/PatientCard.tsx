import { useModal, ModalType } from '@/shared/context/ModalContext';
import { Badge, Avatar, IconButton } from '@/shared/ui';
import type { CardComponentProps } from '@/shared/ui/Table';
import { calculateAge, formatPhoneNumber } from '@/utils';
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
      className="bg-surface border border-border rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col h-full"
    >
      {/* Header: Avatar (top left) + Gender badge (top right) */}
      <div className="mb-3 pb-3 border-b border-border flex justify-between items-center">
        {/* Avatar: Patient name + Age - positioned at top left */}
        <Avatar
          primaryText={patient.fullName}
          secondaryText={`${calculateAge(patient.dateOfBirth)} years old`}
          size="xs"
        />
        {/* Gender badge on top right */}
        <Badge variant={patient.gender} size="xs" />
      </div>

      {/* Contact info: Phone + email + address */}
      <div className="space-y-2">
        <div className="space-y-1">
          <div className="text-sm text-text-secondary">{formatPhoneNumber(patient.phone)}</div>
          {patient.email && <div className="text-sm text-text-secondary truncate">{patient.email}</div>}
          <div className="text-sm text-text-secondary truncate">
            {patient.address.street}, {patient.address.city} {patient.address.postalCode}
          </div>
        </div>
      </div>

      {/* Bottom section: Add Order button - positioned at bottom right */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
        <div></div>
        <IconButton variant="add" size="sm" title="Add Order" onClick={handleAddOrder} />
      </div>
    </div>
  );
}
