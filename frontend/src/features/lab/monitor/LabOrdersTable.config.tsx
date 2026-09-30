/* eslint-disable react-refresh/only-export-components -- table config + mobile card colocated */
/**
 * Column registry and mobile card for the lab dashboard orders table.
 */
import {
  LabDepartmentBadge,
  LabPriorityBadge,
  SampleStatusBadge,
  SampleTypeBadge,
} from '../components/LabDomainBadges';
import {
  buildViews,
  createBadgeColumn,
  createColumn,
  type TableViewConfig,
} from '@/components/data-table';
import { MobileEntityCard } from '@/components';
import type { CardComponentProps } from '@/components';
import { getCategoryLabel } from '@/features/catalog/constants/catalogConfig';
import { BlockedReasonBadge } from '@/features/lab';
import { displayId } from '@/utils';
import {
  renderDateTimeCell,
  renderTableEmptyCell,
  renderTableTwoLineCell,
} from '@/utils/tableColumnRenders';
import type { LabOrderTableRow } from './LabOrdersTable';

const VIEWS = {
  full: ['test', 'patient', 'sampleType', 'doctor', 'priority', 'department', 'status', 'date'],
  medium: ['test', 'patient', 'sampleType', 'priority', 'status', 'date'],
  compact: ['test', 'patient', 'status'],
} as const;

function LabOrderTableCard({ item, onClick }: CardComponentProps<LabOrderTableRow>) {
  return (
    <MobileEntityCard onClick={onClick}>
      <MobileEntityCard.Header
        leading={
          <div className="min-w-0 space-y-space-1">
            {renderTableTwoLineCell(item.testName, item.testCode)}
            {renderTableTwoLineCell(
              item.patientName,
              `MRN: ${displayId.patient(item.patientId)}`,
            )}
          </div>
        }
        trailing={<LabPriorityBadge priority={item.priority} size="xs" />}
      />
      <div className="flex flex-wrap items-center gap-space-2">
        {item.blockedLabel ? (
          <BlockedReasonBadge label={item.blockedLabel} size="xs" showIcon={false} />
        ) : (
          <SampleStatusBadge status={item.status} size="xs" />
        )}
        {item.sampleType ? (
          <SampleTypeBadge sampleType={item.sampleType} size="xs" className="border-none" />
        ) : null}
        {item.department ? (
          <LabDepartmentBadge department={item.department} size="xs" className="border-none" />
        ) : null}
      </div>
      <div className="mt-auto pt-space-3">{renderDateTimeCell(item.date)}</div>
    </MobileEntityCard>
  );
}

export function createLabOrdersTableConfig(): TableViewConfig<LabOrderTableRow> {
  const columnMap = {
    test: createColumn<LabOrderTableRow>('test', 'Test', {
      width: 'xl',
      sortable: true,
      accessor: row => `${row.testName} ${row.testCode}`,
      render: row => renderTableTwoLineCell(row.testName, row.testCode),
    }),
    patient: createColumn<LabOrderTableRow>('patient', 'Patient', {
      width: 'lg',
      sortable: true,
      accessor: row => row.patientName,
      render: row =>
        renderTableTwoLineCell(row.patientName, `MRN: ${displayId.patient(row.patientId)}`),
    }),
    sampleType: createBadgeColumn<LabOrderTableRow>(
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
    doctor: createColumn<LabOrderTableRow>('doctor', 'Doctor', {
      width: 'lg',
      accessor: row => row.doctorName ?? '',
      render: row =>
        renderTableTwoLineCell(
          row.doctorName || '—',
          row.department ? getCategoryLabel(row.department) : null,
        ),
    }),
    priority: createBadgeColumn<LabOrderTableRow>(
      'priority',
      'Priority',
      row => <LabPriorityBadge priority={row.priority} size="xs" />,
      { accessor: row => row.priority },
    ),
    department: createBadgeColumn<LabOrderTableRow>(
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
    status: createBadgeColumn<LabOrderTableRow>(
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
    date: createColumn<LabOrderTableRow>('date', 'Updated', {
      width: 'lg',
      sortable: true,
      accessor: row => row.date,
      render: row => renderDateTimeCell(row.date),
    }),
  };

  return {
    ...buildViews(columnMap, VIEWS),
    CardComponent: LabOrderTableCard,
  };
}
