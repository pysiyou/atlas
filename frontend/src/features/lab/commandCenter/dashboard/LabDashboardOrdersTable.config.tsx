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
import {
  renderDateTimeCell,
  renderTableEmptyCell,
  renderTableTwoLineCell,
} from '@/utils/tableColumnRenders';
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
      render: row => renderTableTwoLineCell(row.testName, row.testCode),
    }),
    patient: createColumn<LabDashboardOrderRow>('patient', 'Patient', {
      width: 'lg',
      sortable: true,
      accessor: row => row.patientName,
      render: row =>
        renderTableTwoLineCell(row.patientName, `MRN: ${displayId.patient(row.patientId)}`),
    }),
    sampleType: createBadgeColumn<LabDashboardOrderRow>(
      'sampleType',
      'Sample Type',
      row =>
        row.sampleType ? (
          <SampleTypeBadge sampleType={row.sampleType} size="xs" className="border-none" />
        ) : (
          renderTableEmptyCell()
        ),
      { accessor: row => row.sampleType, width: 'md', sortable: true },
    ),
    doctor: createColumn<LabDashboardOrderRow>('doctor', 'Doctor', {
      width: 'lg',
      accessor: row => row.doctorName ?? '',
      render: row =>
        renderTableTwoLineCell(
          row.doctorName || '—',
          row.department ? getCategoryLabel(row.department) : null,
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
          renderTableEmptyCell()
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
    date: createColumn<LabDashboardOrderRow>('date', 'Updated', {
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
