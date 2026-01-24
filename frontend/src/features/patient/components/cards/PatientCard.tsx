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
      className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full"
    >
      {/* Header: Avatar (top left) + Gender badge (top right) */}
      <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-100">
        {/* Avatar: Patient name + Age - positioned at top left */}
        <Avatar
          primaryText={patient.fullName}
          secondaryText={`${calculateAge(patient.dateOfBirth)} years old`}
          size="xs"
        />
        {/* Gender badge on top right */}
        <Badge
          variant={
            patient.gender === 'male' ? 'primary' : patient.gender === 'female' ? 'pink' : 'default'
          }
          size="xs"
        >
          {patient.gender.toUpperCase()}
        </Badge>
      </div>

      {/* Contact info: Phone + email + address */}
      <div className="grow">
        <div className="space-y-1">
          <div className="text-xs text-gray-700">{formatPhoneNumber(patient.phone)}</div>
          {patient.email && <div className="text-xs text-gray-500 truncate">{patient.email}</div>}
          <div className="text-xs text-gray-500 truncate">
            {patient.address.street}, {patient.address.city} {patient.address.postalCode}
          </div>
        </div>
      </div>

      {/* Bottom section: Add Order button - positioned at bottom right */}
      <div className="flex justify-end items-center mt-auto pt-3">
        <IconButton variant="add" size="sm" title="Add Order" onClick={handleAddOrder} />
      </div>
    </div>
  );
}
