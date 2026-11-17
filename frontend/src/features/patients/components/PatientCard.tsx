import type { CardComponentProps } from '@/components/data-table';
import type { Patient } from '@/types';
import { formatPatientSexAgeLine } from '../utils/patientFormatters';
import { PatientGenderBadge } from './PatientGenderBadge';
import { CardFooter, MetadataGrid, MetadataItem, Stack } from '@/components/layout';
import { actionButtonPreset, Avatar, IconButton } from '@/components/primitives';
import { ListCard } from '@/components/surfaces';
import { RecordId } from '@/features/shared';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import { useModuleListTitles } from '@/strings';
import { formatPhoneNumber } from '@/utils';
import React from 'react';

/**
 * PatientCard Component
 *
 * Custom mobile card component for patient data.
 * Displays patient information in a mobile-friendly card layout.
 */
export function PatientCard({ item: patient, onClick }: CardComponentProps<Patient>) {
  const { openModal } = useModal();
  const titles = useModuleListTitles();

  const handleAddOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    openModal({ type: ModalType.NEW_ORDER, patientId: patient.id });
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
          <MetadataItem>
            {formatPatientSexAgeLine(patient.gender, patient.dateOfBirth) ?? '—'}
          </MetadataItem>
          <MetadataItem>{formatPhoneNumber(patient.phone)}</MetadataItem>
          {patient.email ? <MetadataItem>{patient.email}</MetadataItem> : null}
        </MetadataGrid>
      </Stack>

      <CardFooter align="end">
        <IconButton
          {...actionButtonPreset('add')}
          size="sm"
          title={titles.addOrder}
          onClick={handleAddOrder}
        />
      </CardFooter>
    </ListCard>
  );
}
