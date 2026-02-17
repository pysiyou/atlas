/**
 * Test Table Configuration - Multi-view table for Command Center test table.
 * Card component only; createTestTableConfig lives in testTableConfigFactory.tsx (react-refresh).
 */
import { formatDate } from '@/utils';
import { displayId } from '@/utils';
import { Badge, Card, Avatar } from '@/shared/ui';
import type { CardComponentProps } from '@/shared/ui/Table';
import type { LabTestRow } from './types';

export function TestTableCard({ item: test, onClick }: CardComponentProps<LabTestRow>) {
  return (
    <Card padding="list" hover className="flex flex-col h-full" onClick={onClick}>
      <div className="flex justify-between items-start mb-3 pb-3 border-b border-border-default">
        <Avatar
          primaryText={test.patientName}
          primaryTextClassName="capitalize"
          secondaryText={displayId.orderTest(test.testId)}
          secondaryTextClassName="font-mono text-brand"
          size="xs"
        />
        <div className="flex items-center gap-1.5">
          <Badge variant={test.order.priority} size="xs" className="border-none" />
          <Badge variant={test.test.status} size="xs" />
        </div>
      </div>
      <div className="grow space-y-2">
        <div>
          <div className="text-text-primary text-sm">{test.testName}</div>
          <div className="text-xs text-brand font-mono">{test.testCode}</div>
        </div>
        <div className="text-xs text-text-tertiary">
          Order: <span className="font-mono">{displayId.order(test.orderId)}</span>
        </div>
      </div>
      <div className="mt-auto pt-3 text-xs text-text-tertiary">{formatDate(test.orderDate)}</div>
    </Card>
  );
}
