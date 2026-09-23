import { Avatar, MobileEntityCard, EntityId } from '@/components';
import { OrderStatusBadge } from '@/features/orders';
import { PaymentMethodBadge, PaymentStatusBadge } from './PaymentStatusBadge';
import type { CardComponentProps } from '@/components';
import { getActiveTests, renderOrderTestsBlock } from '@/features/orders';
import { useTestNameLookup } from '@/features/catalog';
import { formatCurrency, formatDateTime } from '@/utils';
import type { OrderPaymentView } from '../types';
import { PaymentButton } from './PaymentButton';
import { useInvalidatePayments } from '../api/payments';
import { TYPE } from '@/components/theme/recipes';


/**
 * Mobile card for payments list — aligned with PaymentTable columns (amount, status, date, tests summary).
 */
export function PaymentCard({ item, onClick }: CardComponentProps<OrderPaymentView>) {
  const { invalidateAll } = useInvalidatePayments();
  const { getTestName } = useTestNameLookup();
  const { order } = item;

  const handlePaymentSuccess = () => {
    invalidateAll();
  };

  const activeTests = getActiveTests(order.tests ?? []);
  const hasTests =
    activeTests.length > 0 ||
    (order.testCodes?.length ?? 0) > 0 ||
    (order.testCount ?? 0) > 0;

  const displayDate = item.paymentDate ?? order.orderDate;

  return (
    <MobileEntityCard onClick={onClick}>
      <MobileEntityCard.Header
        leading={
          <Avatar
            primaryText={order.patientName || 'N/A'}
            primaryTextClassName=""
            secondaryText={<EntityId type="order" value={order.orderId} />}
            size="xs"
          />
        }
        trailing={<div className="text-text-primary text-lg">{formatCurrency(order.totalPrice)}</div>}
      />

      {hasTests && (
        <div className="min-w-0">
          {renderOrderTestsBlock(activeTests, {
            fallbackCount:
              order.testCount != null && activeTests.length === 0 ? order.testCount : undefined,
            testCodes: activeTests.length === 0 ? order.testCodes : undefined,
            getTestName,
          })}
        </div>
      )}

      <div className="flex justify-between items-center mt-auto pt-space-3 gap-space-2">
        <div className={`${TYPE.meta} tabular-nums`}>{formatDateTime(displayDate)}</div>
        <div className="flex items-center gap-space-2 shrink-0">
          {order.overallStatus && <OrderStatusBadge status={order.overallStatus} size="xs" />}
          <PaymentStatusBadge status={order.paymentStatus} size="xs" />
          {item.paymentMethod && order.paymentStatus !== 'unpaid' ? (
            <PaymentMethodBadge method={item.paymentMethod} size="xs" />
          ) : order.paymentStatus === 'unpaid' ? (
            <div onClick={e => e.stopPropagation()}>
              <PaymentButton order={order} size="sm" onPaymentSuccess={handlePaymentSuccess} />
            </div>
          ) : null}
        </div>
      </div>
    </MobileEntityCard>
  );
}
