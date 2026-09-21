/**
 * Column registry for the lab dashboard orders table.
 */
import { Badge } from '@/components';
import {
  buildViews,
  createBadgeColumn,
  createColumn,
  type TableViewConfig,
} from '@/components/data-table';
import { getCategoryLabel } from '@/features/catalog/constants/catalogConfig';
import { BlockedReasonBadge } from '@/features/lab/components/LabResultStatusBadges';
import { formatDate, parseAppDate, displayId } from '@/utils';
import { format } from 'date-fns';
import { DASHBOARD_TWO_LINE } from '../dashboardStyles';
import type { LabDashboardOrderRow } from './dashboardOrders';
import { LabDashboardOrderCard } from './LabDashboardOrderCard';

const VIEWS = {
  full: ['test', 'patient', 'doctor', 'priority', 'department', 'status', 'date'],
  medium: ['test', 'patient', 'priority', 'status', 'date'],
  compact: ['test', 'patient', 'status'],
} as const;

function twoLineDate(value: string) {
  const parsed = parseAppDate(value);
  if (!parsed) return <span className={DASHBOARD_TWO_LINE.secondary}>—</span>;
  return (
    <div className="min-w-0">
      <div className={DASHBOARD_TWO_LINE.primary}>{formatDate(parsed, 'MMM d, yyyy')}</div>
      <div className={DASHBOARD_TWO_LINE.mrn}>{format(parsed, 'hh:mm a')}</div>
    </div>
  );
}

export function createLabDashboardOrdersTableConfig(): TableViewConfig<LabDashboardOrderRow> {
  const columnMap = {
    test: createColumn<LabDashboardOrderRow>('test', 'Test', {
      width: 'xl',
      sortable: true,
      accessor: row => row.testName,
      render: row => <span className={DASHBOARD_TWO_LINE.primary}>{row.testName}</span>,
    }),
    patient: createColumn<LabDashboardOrderRow>('patient', 'Patient', {
      width: 'lg',
      sortable: true,
      accessor: row => row.patientName,
      render: row => (
        <div className="min-w-0">
          <div className={DASHBOARD_TWO_LINE.primary}>{row.patientName}</div>
          <div className={DASHBOARD_TWO_LINE.mrn}>MRN: {displayId.patient(row.patientId)}</div>
        </div>
      ),
    }),
    doctor: createColumn<LabDashboardOrderRow>('doctor', 'Doctor', {
      width: 'lg',
      accessor: row => row.doctorName ?? '',
      render: row => (
        <div className="min-w-0">
          <div className={DASHBOARD_TWO_LINE.primary}>{row.doctorName || '—'}</div>
          <div className={DASHBOARD_TWO_LINE.mrn}>
            {row.department ? getCategoryLabel(row.department) : ' '}
          </div>
        </div>
      ),
    }),
    priority: createBadgeColumn<LabDashboardOrderRow>(
      'priority',
      'Priority',
      row => <Badge variant={row.priority} size="xs" />,
      { accessor: row => row.priority },
    ),
    department: createBadgeColumn<LabDashboardOrderRow>(
      'department',
      'Department',
      row =>
        row.department ? (
          <Badge variant={row.department} size="xs" className="border-none" />
        ) : (
          <span className={DASHBOARD_TWO_LINE.secondary}>—</span>
        ),
      { accessor: row => row.department ?? '', width: 'md' },
    ),
    status: createBadgeColumn<LabDashboardOrderRow>(
      'status',
      'Status',
      row =>
        row.blockedLabel ? (
          <BlockedReasonBadge label={row.blockedLabel} size="xs" showIcon={false} />
        ) : (
          <Badge variant={row.status} size="xs" />
        ),
      { accessor: row => row.blockedLabel ?? row.status, width: 'md' },
    ),
    date: createColumn<LabDashboardOrderRow>('date', 'Date', {
      width: 'lg',
      sortable: true,
      accessor: row => row.date,
      render: row => twoLineDate(row.date),
    }),
  };

  return {
    ...buildViews(columnMap, VIEWS),
    CardComponent: LabDashboardOrderCard,
  };
}
