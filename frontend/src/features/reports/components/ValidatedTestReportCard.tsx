/**
 * ValidatedTestReportCard Component
 *
 * Custom mobile card component for report data in table view.
 * Displays reportable-order information in a mobile-friendly card layout.
 */
import { Avatar, Badge } from '@/components/primitives';
import { MobileEntityCard } from '@/components/surfaces';
import { EntityId } from '@/components/display';
import type { CardComponentProps } from '@/components/data-table';
import { formatDateTime } from '@/utils';
import { TABLE_DATETIME_SECONDARY_CLASS } from '@/utils/tableColumnRenders';
import type { ReportableOrder } from '../types';
import { ReportPreviewButton } from './ReportPreviewButton';
import { TYPE } from '@/components/theme/recipes';
import { getActiveOrderTests } from '../utils/prepareReportData';


interface ValidatedTestReportCardProps extends CardComponentProps<ReportableOrder> {
  /** Callback when preview button is clicked */
  onPreview: (order: ReportableOrder) => void;
}

/**
 * ValidatedTestReportCard - Mobile card view for reportable orders
 *
 * @param item - ReportableOrder data
 * @param onClick - Optional click handler for the card
 * @param onPreview - Handler for preview button
 */
export function ValidatedTestReportCard({ item: order, onClick, onPreview }: ValidatedTestReportCardProps) {
  const tests = getActiveOrderTests(order.order);
  const testNames = tests.map(test => test.testName).join(', ') || `${order.activeTestCount} test(s)`;
  const badgeLabel = `${order.activeTestCount} tests · ${order.validatedTestCount} validated`;
  const badgeVariant =
    order.activeTestCount > 0 && order.validatedTestCount === order.activeTestCount
      ? 'success'
      : order.validatedTestCount > 0
        ? 'warning'
        : 'neutral';

  return (
    <MobileEntityCard onClick={onClick}>
      <MobileEntityCard.Header
        leading={
          <Avatar
            primaryText={order.patientName}
            primaryTextClassName="capitalize"
            secondaryText={<EntityId type="order" value={order.orderId} />}
            size="xs"
          />
        }
        trailing={<Badge variant={badgeVariant} label={badgeLabel} size="xs" />}
      />

      <div className="grow space-y-space-2">
        <div>
          <div className={TYPE.amount}>{testNames}</div>
          <EntityId variant="block">{tests.map(test => test.testCode).join(', ')}</EntityId>
        </div>
      </div>

      <div className="flex justify-between items-center mt-auto pt-space-3">
        <div className={TABLE_DATETIME_SECONDARY_CLASS}>{formatDateTime(order.orderDate)}</div>
        <div onClick={e => e.stopPropagation()}>
          <ReportPreviewButton order={order} onPreview={onPreview} size="sm" />
        </div>
      </div>
    </MobileEntityCard>
  );
}
