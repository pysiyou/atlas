import { useModal, ModalType } from '@/lib/context/ModalContext';
import { actionButtonPreset, Avatar, IconButton } from '@/components/primitives';
import { CardFooter, MetadataGrid, MetadataItem, Stack } from '@/components/layout';
import { ListCard } from '@/components/surfaces';
import { RecordId } from '@/features/shared/components';
import { PatientGenderBadge } from './PatientGenderBadge';
import type { CardComponentProps } from '@/components/data-table';
import { calculateAge, formatPhoneNumber } from '@/utils';
import type { Patient } from '@/types';

/**
 * PatientCard Component
 *
 * Custom mobile card component for patient data.
 * Displays patient information in a mobile-friendly card layout.
 */
export function PatientCard({ item: patient, onClick }: CardComponentProps<Patient>) {
  const { openModal } = useModal();

  const handleAddOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    openModal({ type: ModalType.NEW_ORDER, patientId: patient.id.toString() });
  };

  return (
    <ListCard onPress={onClick}>
      <ListCard.Header
        leading={
          <Avatar
            primaryText={patient.fullName}
            primaryTextClassName=""
            secondarySlot="entity"
            secondaryText={<RecordId type="patient" value={patient.id} emphasis="mutedBlock" />}
            size="xs"
          />
        }
        trailing={<PatientGenderBadge gender={patient.gender} size="xs" />}
      />

      <Stack gap="inline" className="grow pt-space-1">
        <MetadataGrid columns={2}>
          <MetadataItem>{`${calculateAge(patient.dateOfBirth)} years old`}</MetadataItem>
          <MetadataItem>{formatPhoneNumber(patient.phone)}</MetadataItem>
          {patient.email ? <MetadataItem>{patient.email}</MetadataItem> : null}
        </MetadataGrid>
      </Stack>

      <CardFooter align="end">
        <IconButton {...actionButtonPreset('add')} size="sm" title="Add Order" onClick={handleAddOrder} />
      </CardFooter>
    </ListCard>
  );
}
