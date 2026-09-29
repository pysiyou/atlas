/**
 * Patient-domain table cell render helpers.
 */

import type { ReactNode } from 'react';
import { EntityId } from '@/components/display/EntityId';
import { calculateAge, formatDateTime } from '@/utils';
import { renderPatientNameBlock } from '@/utils/tableColumnRenders';
import { TABLE_TYPE } from '@/components/theme/recipes';

export function renderPatientId(patientId: string | number): ReactNode {
  return <EntityId type="patient" value={patientId} variant="block" />;
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
  return (
    <div className="min-w-0 font-normal">
      <div className={`${TABLE_TYPE.cell} truncate font-normal`}>{countLabel}</div>
      <div className={`${TABLE_TYPE.meta} truncate font-normal tabular-nums`}>
        {formatDateTime(lastOrderDate)}
      </div>
    </div>
  );
}

export function renderPatientNameWithAge(fullName: string, dateOfBirth: string): ReactNode {
  return renderPatientNameBlock(
    fullName,
    <div className={`${TABLE_TYPE.meta} truncate font-normal`}>
      {calculateAge(dateOfBirth)} years old
    </div>
  );
}
