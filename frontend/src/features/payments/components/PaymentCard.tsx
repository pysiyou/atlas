import type { OrderPaymentView } from '../types';
import type { CardComponentProps } from '@/components/data-table';
import { useInvalidatePayments } from '../api/payments';
import { hasRecordedPayment, isFullyPaid } from '../utils/paymentStatus';
import { PaymentButton } from './PaymentButton';
import { Avatar } from '@/components/primitives';
import { ListCard } from '@/components/surfaces';
import { useOrderableTestNameLookup } from '@/features/catalog';
import { getBillableTests, OrderStatusBadge, renderOrderTestsBlock } from '@/features/orders';
import { RecordId, StatusValueBadge } from '@/features/shared';
import { INTERACTIVE, PRICE_DISPLAY } from '@/theme/recipes';
import { formatCurrency, formatDateTime } from '@/utils';
import { renderTableSecondaryRecordId } from '@/utils/PresentationRenders';
import { TABLE_DATETIME_SECONDARY_CLASS } from '@/utils/TableColumnRenders';

/**
 * Mobile card for payments list — aligned with PaymentTable columns (amount, status, date, tests summary).
 */
export function PaymentCard({ item, onClick }: CardComponentProps<OrderPaymentView>) {
  const { invalidateAll } = useInvalidatePayments();
  const { getTestName } = useOrderableTestNameLookup();
  const { order } = item;

  const handlePaymentSuccess = () => {
    invalidateAll();
  };

  const activeTests = getBillableTests(order.tests ?? []);
  const hasTests =
    activeTests.length > 0 ||
    (order.testCodes?.length ?? 0) > 0 ||
    (order.testCount ?? 0) > 0;

  const displayDate = item.paymentDate ?? order.orderDate;

  return (
    <ListCard onPress={onClick}>
      <ListCard.Header
        leading={
          <Avatar
            primaryText={order.patientName || 'N/A'}
            primaryTextClassName=""
            secondarySlot="entity"
            secondaryText={renderTableSecondaryRecordId({
              type: 'patient',
              value: order.patientId,
            })}
            size="xs"
          />
        }
        trailing={<div className={PRICE_DISPLAY}>{formatCurrency(order.totalPrice)}</div>}
      />

      {hasTests && (
        <div className="min-w-0">
          {renderOrderTestsBlock(activeTests, {
            fallbackCount:
              order.testCount != null && activeTests.length === 0 ? order.testCount : undefined,
            testCodes: activeTests.length === 0 ? order.testCodes : undefined,
            getTestName,
            layout: 'namesFirst',
          })}
        </div>
      )}

      <div className="flex justify-between items-center mt-auto pt-space-3 gap-space-2">
        <div className={TABLE_DATETIME_SECONDARY_CLASS}>
          <RecordId type="order" value={order.orderId} emphasis="mutedBlock" />
          <span className="block mt-space-0-5">{formatDateTime(displayDate)}</span>
        </div>
        <div className="flex items-center gap-space-2 shrink-0">
          {order.overallStatus && <OrderStatusBadge status={order.overallStatus} size="xs" />}
          <StatusValueBadge value={order.paymentStatus} size="xs" />
          {item.paymentMethod && hasRecordedPayment(order.paymentStatus) ? (
            <StatusValueBadge value={item.paymentMethod} size="xs" />
          ) : null}
          {!isFullyPaid(order.paymentStatus) ? (
            <div className={INTERACTIVE.actionIsland} onClick={e => e.stopPropagation()}>
              <PaymentButton order={order} size="sm" onPaymentSuccess={handlePaymentSuccess} />
            </div>
          ) : null}
        </div>
      </div>
    </ListCard>
  );
}
