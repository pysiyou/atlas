/**
 * Patient-domain table cell render helpers.
 */

import type { ReactNode } from 'react';
import { RecordId } from '@/features/shared';
import { calculateAge, formatDateTime } from '@/utils';
import { renderPatientNameBlock, renderTableTwoLineCell } from '@/utils/tableColumnRenders';
import { TABLE_TYPE } from '@/theme/recipes';
import type { Gender } from '@/types';
import { formatPatientSexAgeLine } from './patientFormatters';

export function renderPatientId(patientId: string | number): ReactNode {
  return <RecordId type="patient" value={patientId} emphasis="block" />;
}

/** Two-line orders summary — matches contact / name column pattern (cell + meta). */
export function renderPatientOrdersSummary(
  orderCount: number,
  lastOrderDate?: string
): ReactNode {
  if (orderCount === 0 || !lastOrderDate) {
    return (
      <span className={`${TABLE_TYPE.meta} truncate block font-normal`}>No orders</span>
    );
  }
  const countLabel = orderCount === 1 ? '1 order' : `${orderCount} orders`;
  return renderTableTwoLineCell(countLabel, formatDateTime(lastOrderDate), {
    secondaryClassName: 'tabular-nums',
  });
}

export function renderPatientNameWithAge(fullName: string, dateOfBirth: string): ReactNode {
  return renderPatientNameBlock(
    fullName,
    <div className={`${TABLE_TYPE.meta} truncate font-normal`}>
      {calculateAge(dateOfBirth)} years old
    </div>
  );
}

/** Secondary line under patient name — sex and age for clinical context. */
export function renderPatientSexAgeSecondary(
  gender?: Gender | string | null,
  dateOfBirth?: string | null,
): ReactNode {
  const line = formatPatientSexAgeLine(gender, dateOfBirth);
  if (!line) {
    return null;
  }
  return <div className={`${TABLE_TYPE.meta} truncate font-normal`}>{line}</div>;
}
