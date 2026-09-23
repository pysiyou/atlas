import { useModal, ModalType } from '@/lib/context/ModalContext';
import { actionButtonPreset, Avatar, IconButton, MobileEntityCard, EntityId } from '@/components';
import { PatientGenderBadge } from './PatientGenderBadge';
import type { CardComponentProps } from '@/components';
import { calculateAge, formatPhoneNumber } from '@/utils';
import type { Patient } from '@/types';
import { RADIUS, TYPE } from '@/components/theme/recipes';


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
    <MobileEntityCard onClick={onClick}>
      <MobileEntityCard.Header
        leading={
          <Avatar
            primaryText={patient.fullName}
            primaryTextClassName=""
            secondaryText={<EntityId type="patient" value={patient.id} />}
            size="xs"
          />
        }
        trailing={<PatientGenderBadge gender={patient.gender} size="xs" />}
      />

      {/* Contact info: Age, Phone, email */}
      <div className="grow pt-space-1">
        <div className="grid grid-cols-2 gap-x-space-3 gap-y-space-2">
          {/* Age */}
          <div className="flex items-center gap-space-2">
            <span className={`w-1 h-1 ${RADIUS.pill} bg-text-muted shrink-0`} />
            <span className={`${TYPE.label} truncate`}>
              {calculateAge(patient.dateOfBirth)} years old
            </span>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-space-2">
            <span className={`w-1 h-1 ${RADIUS.pill} bg-text-muted shrink-0`} />
            <span className={`${TYPE.label} truncate`}>
              {formatPhoneNumber(patient.phone)}
            </span>
          </div>

          {/* Email */}
          {patient.email && (
            <div className="flex items-center gap-space-2">
              <span className={`w-1 h-1 ${RADIUS.pill} bg-text-muted shrink-0`} />
              <span className={`${TYPE.label} truncate`}>{patient.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom section: Add Order button - positioned at bottom right */}
      <div className="flex justify-between items-center mt-auto pt-space-3">
        <div></div>
        <IconButton {...actionButtonPreset('add')} size="sm" title="Add Order" onClick={handleAddOrder} />
      </div>
    </MobileEntityCard>
  );
}
