import { useModal, ModalType } from '@/shared/context/ModalContext';
import { Badge, Avatar, IconButton } from '@/shared/ui';
import type { CardComponentProps } from '@/shared/ui/Table';
import { calculateAge, formatPhoneNumber } from '@/utils';
import type { Patient } from '@/types';
import { mobileCard } from '@/shared/design-system/tokens/components/card';

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
      className={mobileCard.base}
    >
      {/* Header: Avatar (top left) + Gender badge (top right) */}
      <div className={mobileCard.header.container}>
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
      <div className={mobileCard.content.container}>
        <div className="space-y-1">
          <div className={mobileCard.content.text}>{formatPhoneNumber(patient.phone)}</div>
          {patient.email && <div className={`${mobileCard.content.textSecondary} truncate`}>{patient.email}</div>}
          <div className={`${mobileCard.content.textSecondary} truncate`}>
            {patient.address.street}, {patient.address.city} {patient.address.postalCode}
          </div>
        </div>
      </div>

      {/* Bottom section: Add Order button - positioned at bottom right */}
      <div className={mobileCard.footer.container}>
        <IconButton variant="add" size="sm" title="Add Order" onClick={handleAddOrder} />
      </div>
    </div>
  );
}
