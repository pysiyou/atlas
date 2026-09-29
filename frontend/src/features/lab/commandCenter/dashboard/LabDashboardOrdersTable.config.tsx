/**
 * Column registry for the lab dashboard orders table.
 */
import {
  LabDepartmentBadge,
  LabPriorityBadge,
  SampleStatusBadge,
  SampleTypeBadge,
} from '../../components/LabDomainBadges';
import {
  buildViews,
  createBadgeColumn,
  createColumn,
  type TableViewConfig,
} from '@/components/data-table';
import { getCategoryLabel } from '@/features/catalog/constants/catalogConfig';
import { BlockedReasonBadge } from '@/features/lab';
import { displayId } from '@/utils';
import { renderDateTimeCell } from '@/utils/tableColumnRenders';
import { DASHBOARD_TWO_LINE } from '../dashboardStyles';
import type { LabDashboardOrderRow } from './dashboardOrders';
import { LabDashboardOrderCard } from './LabDashboardOrderCard';

const VIEWS = {
  full: ['test', 'patient', 'sampleType', 'doctor', 'priority', 'department', 'status', 'date'],
  medium: ['test', 'patient', 'sampleType', 'priority', 'status', 'date'],
  compact: ['test', 'patient', 'status'],
} as const;

export function createLabDashboardOrdersTableConfig(): TableViewConfig<LabDashboardOrderRow> {
  const columnMap = {
    test: createColumn<LabDashboardOrderRow>('test', 'Test', {
      width: 'xl',
      sortable: true,
      accessor: row => `${row.testName} ${row.testCode}`,
      render: row => (
        <div className="min-w-0">
          <div className={DASHBOARD_TWO_LINE.primary}>{row.testName}</div>
          <div className={DASHBOARD_TWO_LINE.mrn}>{row.testCode}</div>
        </div>
      ),
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
    sampleType: createBadgeColumn<LabDashboardOrderRow>(
      'sampleType',
      'Sample Type',
      row =>
        row.sampleType ? (
          <SampleTypeBadge sampleType={row.sampleType} size="xs" className="border-none" />
        ) : (
          <span className={DASHBOARD_TWO_LINE.secondary}>—</span>
        ),
      { accessor: row => row.sampleType, width: 'md', sortable: true },
    ),
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
      row => <LabPriorityBadge priority={row.priority} size="xs" />,
      { accessor: row => row.priority },
    ),
    department: createBadgeColumn<LabDashboardOrderRow>(
      'department',
      'Department',
      row =>
        row.department ? (
          <LabDepartmentBadge department={row.department} size="xs" className="border-none" />
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
          <SampleStatusBadge status={row.status} size="xs" />
        ),
      { accessor: row => row.blockedLabel ?? row.status, width: 'md' },
    ),
    date: createColumn<LabDashboardOrderRow>('date', 'Date', {
      width: 'lg',
      sortable: true,
      accessor: row => row.date,
      render: row => renderDateTimeCell(row.date),
    }),
  };

  return {
    ...buildViews(columnMap, VIEWS),
    CardComponent: LabDashboardOrderCard,
  };
}
