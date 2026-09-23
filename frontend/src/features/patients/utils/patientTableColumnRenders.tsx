/**
 * Patient-domain table cell render helpers.
 */

import type { ReactNode } from 'react';
import { EntityId } from '@/components/display/EntityId';
import { calculateAge } from '@/utils';
import { renderPatientNameBlock } from '@/utils/tableColumnRenders';
import { TABLE_TYPE } from '@/components/theme/recipes';

export function renderPatientId(patientId: string | number): ReactNode {
  return <EntityId type="patient" value={patientId} variant="block" />;
}

export function renderPatientNameWithAge(fullName: string, dateOfBirth: string): ReactNode {
  return renderPatientNameBlock(
    fullName,
    <div className={`${TABLE_TYPE.meta} truncate font-normal`}>
      {calculateAge(dateOfBirth)} years old
    </div>
  );
}
