/**
 * Command Center active-tests table configuration.
 * Column renders and card follow the same patterns as OrderTable.config and TestsTableConfig.
 */
import type { NavigateFunction } from 'react-router-dom';
import type { FC } from 'react';
import { Badge, Card, Avatar } from '@/components';
import type { CardComponentProps, TableViewConfig } from '@/components';
import {
  createBadgeColumn,
  createIdColumn,
  renderDisplayId,
  renderNavigableOrderId,
  renderOrderPatientName,
  renderOrderDateCell,
} from '@/components/data-table';
import { displayId, formatDate } from '@/utils';
import { formatDurationMs } from '@/utils/formatDuration.utils';
import type { CommandCenterTestRow } from '../useCommandCenter';

function createCommandCenterTableCard(): FC<CardComponentProps<CommandCenterTestRow>> {
  return function CommandCenterTableCard({ item: test, onClick }) {
    return (
      <Card padding="list" hover className="flex flex-col h-full" onClick={onClick}>
        <div className="flex justify-between items-start mb-3 pb-3 border-b border-border-default">
          <Avatar
            primaryText={test.patientName}
            primaryTextClassName="capitalize"
            secondaryText={displayId.orderTest(test.id as number)}
            secondaryTextClassName="entity-id"
            size="xs"
          />
          <div className="flex items-center gap-1.5">
            <Badge variant={test.priority} size="xs" className="border-none" />
            <Badge variant={test.status} size="xs" />
          </div>
        </div>
        <div className="grow space-y-2">
          <div>
            <div className="text-text-primary text-sm">{test.testName}</div>
            <div className="entity-id">{test.testCode}</div>
          </div>
          <div className="text-xs text-text-tertiary">
            Order: <span className="entity-id">{displayId.order(test.orderId)}</span>
          </div>
        </div>
        <div className="mt-auto pt-3 text-xs text-text-tertiary">
          {formatDate(test.orderDate ?? '')}
        </div>
      </Card>
    );
  };
}

export function createCommandCenterTableConfig(
  navigate: NavigateFunction
): TableViewConfig<CommandCenterTestRow> {
  const renderTestId = (row: CommandCenterTestRow) =>
    renderDisplayId(row.id as number, displayId.orderTest);

  const renderTestName = (row: CommandCenterTestRow) => (
    <div className="min-w-0 font-normal">
      <div className="text-text-primary truncate font-normal">{row.testName}</div>
      <div className="entity-id truncate font-normal">{row.testCode}</div>
    </div>
  );

  const renderWait = (row: CommandCenterTestRow) => {
    if (row.waitMs == null) {
      return <span className="text-xs text-text-tertiary">—</span>;
    }
    return <span className="text-xs text-text-secondary">{formatDurationMs(row.waitMs)}</span>;
  };

  const renderStatus = (row: CommandCenterTestRow) => <Badge variant={row.status} size="sm" />;

  const renderPriority = (row: CommandCenterTestRow) => (
    <Badge variant={row.priority} size="sm" className="border-none" />
  );

  const waitColumn = {
    key: 'waitMs',
    header: 'Wait',
    width: 'sm' as const,
    sortable: true,
    render: renderWait,
  };

  return {
    fullColumns: [
      createIdColumn<CommandCenterTestRow>('id', 'Test ID', row => renderTestId(row), {
        sortable: true,
      }),
      createIdColumn<CommandCenterTestRow>(
        'orderId',
        'Order ID',
        row => renderNavigableOrderId(row.orderId, navigate),
        { sortable: true }
      ),
      {
        key: 'testName',
        header: 'Test',
        width: 'fill',
        sortable: true,
        render: renderTestName,
      },
      {
        key: 'patientName',
        header: 'Patient',
        width: 'fill',
        sortable: true,
        render: row => renderOrderPatientName(row.patientName, row.patientId),
      },
      createBadgeColumn<CommandCenterTestRow>('priority', 'Priority', renderPriority, {
        sortable: true,
        width: 'sm',
      }),
      createBadgeColumn<CommandCenterTestRow>('status', 'Status', renderStatus, {
        sortable: true,
        width: 'md',
      }),
      waitColumn,
      {
        key: 'orderDate',
        header: 'Date',
        width: 'lg',
        sortable: true,
        render: row => renderOrderDateCell(row.orderDate),
      },
    ],
    mediumColumns: [
      createIdColumn<CommandCenterTestRow>('id', 'Test ID', row => renderTestId(row), {
        sortable: true,
      }),
      {
        key: 'testName',
        header: 'Test',
        width: 'fill',
        sortable: true,
        render: renderTestName,
      },
      {
        key: 'patientName',
        header: 'Patient',
        width: 'fill',
        sortable: true,
        render: row => renderOrderPatientName(row.patientName, row.patientId),
      },
      createBadgeColumn<CommandCenterTestRow>('priority', 'Priority', renderPriority, {
        sortable: true,
        width: 'sm',
      }),
      createBadgeColumn<CommandCenterTestRow>('status', 'Status', renderStatus, {
        sortable: true,
        width: 'sm',
      }),
      waitColumn,
      {
        key: 'orderDate',
        header: 'Date',
        width: 'lg',
        sortable: true,
        render: row => renderOrderDateCell(row.orderDate),
      },
    ],
    compactColumns: [
      createIdColumn<CommandCenterTestRow>('id', 'Test ID', row => renderTestId(row), {
        sortable: true,
      }),
      {
        key: 'testName',
        header: 'Test',
        width: 'fill',
        sortable: true,
        render: renderTestName,
      },
      createBadgeColumn<CommandCenterTestRow>('priority', 'Priority', renderPriority, {
        sortable: true,
        width: 'sm',
      }),
      createBadgeColumn<CommandCenterTestRow>('status', 'Status', renderStatus, {
        sortable: true,
        width: 'sm',
      }),
      {
        key: 'orderDate',
        header: 'Date',
        width: 'md',
        sortable: true,
        render: row => renderOrderDateCell(row.orderDate),
      },
    ],
    CardComponent: createCommandCenterTableCard(),
  };
}
