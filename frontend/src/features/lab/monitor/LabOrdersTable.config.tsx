/* eslint-disable react-refresh/only-export-components -- table config + mobile card colocated */
/**
 * Column registry and mobile card for the lab dashboard orders table.
 */
import {
  LabDepartmentBadge,
  LabPriorityBadge,
  SampleTypeBadge,
} from '../components/LabDomainBadges';
import {
  buildViews,
  createBadgeColumn,
  createColumn,
  createDateTimeColumn,
  TABLE_COLUMN_WIDTH,
  type TableViewConfig,
} from '@/components/data-table';
import { LabPresentationTableCell } from '@/features/lab/components/LabPresentationBadge';
import { ListCard } from '@/components/surfaces';
import type { CardComponentProps } from '@/components/data-table';
import { getCategoryLabel } from '@/features/catalog/constants/catalogConfig';
import { OrderTestStatusBadge } from '@/features/orders';
import { getOrderTestLineageRowClass } from '@/features/orders';
import { cn } from '@/utils';
import {
  renderDateTimeCell,
  renderPatientNameBlock,
  renderTableEmptyCell,
  renderTableTwoLineCell,
} from '@/utils/tableColumnRenders';
import { renderTableSecondaryRecordId } from '@/utils/presentationRenders';
import type { LabOrderTableRow } from './LabOrdersTable';
import { BADGE } from '@/theme/recipes';

const VIEWS = {
  full: ['test', 'patient', 'sampleType', 'doctor', 'priority', 'department', 'status', 'date'],
  medium: ['test', 'patient', 'sampleType', 'priority', 'status', 'date'],
  compact: ['test', 'patient', 'status'],
} as const;

function renderMonitorStatus(row: LabOrderTableRow) {
  const presentation = row.statusPresentation;
  if (presentation) {
    return <LabPresentationTableCell presentation={presentation} size="xs" />;
  }
  return (
    <OrderTestStatusBadge status={row.status} presentation={null} layout="compact" size="xs" />
  );
}

function monitorStatusAccessor(row: LabOrderTableRow): string {
  const presentation = row.statusPresentation;
  if (presentation?.primary) {
    const secondary = presentation.secondary?.trim();
    return secondary ?? presentation.primary;
  }
  return row.status;
}

function LabOrderTableCard({ item, onClick }: CardComponentProps<LabOrderTableRow>) {
  return (
    <ListCard
      onPress={onClick}
      className={cn(getOrderTestLineageRowClass({ status: item.status }))}
    >
      <ListCard.Header
        leading={
          <div className="min-w-0 space-y-space-1">
            {renderTableTwoLineCell(item.testName, item.testCode)}
            {renderPatientNameBlock(
              item.patientName,
              renderTableSecondaryRecordId({ type: 'patient', value: item.patientId }),
            )}
          </div>
        }
        trailing={<LabPriorityBadge priority={item.priority} size="xs" />}
      />
      <div className="flex flex-wrap items-center gap-space-2">
        {renderMonitorStatus(item)}
        {item.sampleType ? (
          <SampleTypeBadge sampleType={item.sampleType} size="xs" className={BADGE.tableEmbed} />
        ) : null}
        {item.department ? (
          <LabDepartmentBadge department={item.department} size="xs" className={BADGE.tableEmbed} />
        ) : null}
      </div>
      <div className="mt-auto pt-space-3">{renderDateTimeCell(item.date)}</div>
    </ListCard>
  );
}

export function createLabOrdersTableConfig(): TableViewConfig<LabOrderTableRow> {
  const columnMap = {
    test: createColumn<LabOrderTableRow>('test', 'Test', {
      width: TABLE_COLUMN_WIDTH.primary,
      sortable: true,
      accessor: row => `${row.testName} ${row.testCode}`,
      render: row => renderTableTwoLineCell(row.testName, row.testCode),
    }),
    patient: createColumn<LabOrderTableRow>('patient', 'Patient', {
      width: TABLE_COLUMN_WIDTH.supporting,
      sortable: true,
      accessor: row => row.patientName,
      render: row =>
        renderPatientNameBlock(
          row.patientName,
          renderTableSecondaryRecordId({ type: 'patient', value: row.patientId }),
        ),
    }),
    sampleType: createBadgeColumn<LabOrderTableRow>(
      'sampleType',
      'Sample Type',
      row =>
        row.sampleType ? (
          <SampleTypeBadge sampleType={row.sampleType} size="xs" className={BADGE.tableEmbed} />
        ) : (
          renderTableEmptyCell()
        ),
      { accessor: row => row.sampleType, sortable: true },
    ),
    doctor: createColumn<LabOrderTableRow>('doctor', 'Doctor', {
      width: TABLE_COLUMN_WIDTH.supporting,
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
          <LabDepartmentBadge department={row.department} size="xs" className={BADGE.tableEmbed} />
        ) : (
          renderTableEmptyCell()
        ),
      { accessor: row => row.department ?? '' },
    ),
    status: createBadgeColumn<LabOrderTableRow>(
      'status',
      'Status',
      row => renderMonitorStatus(row),
      { accessor: row => monitorStatusAccessor(row), width: TABLE_COLUMN_WIDTH.badgeWide },
    ),
    date: createDateTimeColumn<LabOrderTableRow>(
      'date',
      'Date',
      row => row.date,
      { accessor: row => row.date },
    ),
  };

  return {
    ...buildViews(columnMap, VIEWS),
    CardComponent: LabOrderTableCard,
  };
}
