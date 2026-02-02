/**
 * Command center activity table column config.
 * Headerless table: order id, patient id, sample id, test code, status, date (last modified).
 */

import { Badge } from '@/shared/ui';
import type { ColumnConfig } from '@/shared/ui/Table';
import { formatDate } from '@/utils';
import { displayId } from '@/utils';
import type { CommandCenterActivityRow } from './hooks';

const dataCellClass = 'text-xs text-text-primary truncate';

export const commandCenterActivityColumns: ColumnConfig<CommandCenterActivityRow>[] = [
  {
    key: 'orderId',
    header: '',
    width: 'sm',
    render: (row: CommandCenterActivityRow) => (
      <span className={`font-mono ${dataCellClass}`}>{displayId.order(row.orderId)}</span>
    ),
  },
  {
    key: 'patientId',
    header: '',
    width: 'sm',
    render: (row: CommandCenterActivityRow) => (
      <span className={`font-mono ${dataCellClass}`}>{displayId.patient(row.patientId)}</span>
    ),
  },
  {
    key: 'sampleId',
    header: '',
    width: 'sm',
    render: (row: CommandCenterActivityRow) => (
      <span className={`font-mono ${dataCellClass}`}>{displayId.sample(row.sampleId)}</span>
    ),
  },
  {
    key: 'testCode',
    header: '',
    width: 'sm',
    render: (row: CommandCenterActivityRow) => (
      <span className={`font-mono ${dataCellClass}`}>{row.testCode}</span>
    ),
  },
  {
    key: 'status',
    header: '',
    width: 'sm',
    render: (row: CommandCenterActivityRow) => (
      <Badge variant={row.status} size="sm" />
    ),
  },
  {
    key: 'lastModified',
    header: '',
    width: 'md',
    render: (row: CommandCenterActivityRow) => (
      <span className={dataCellClass}>{formatDate(row.lastModified)}</span>
    ),
  },
];
