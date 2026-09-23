import { Avatar, MobileEntityCard, EntityId } from '@/components';
import type { CardComponentProps } from '@/components';
import { OrderStatusBadge } from './OrderDomainBadges';
import { PaymentStatusBadge } from '@/features/payments';
import { renderOrderTestsBlock } from '@/features/orders';
import { useTestNameLookup } from '@/features/catalog';
import { formatCurrency, formatDateTime } from '@/utils';
import { getActiveTests } from '../utils/orderCalculator';
import type { Order } from '@/types';
import { CARD_PRICE, TYPE } from '@/components/theme/recipes';


type OrderTableCardProps = CardComponentProps<Order> & {
  /** When true, omit patient name (e.g. patient detail related orders). */
  hidePatientName?: boolean;
};

export function OrderTableCard({ item: order, onClick, hidePatientName = false }: OrderTableCardProps) {
  const { getTestName } = useTestNameLookup();
  const activeTests = getActiveTests(order.tests ?? []);
  const hasTests =
    activeTests.length > 0 ||
    (order.testCodes?.length ?? 0) > 0 ||
    (order.testCount ?? 0) > 0;

  return (
    <MobileEntityCard onClick={onClick}>
      <MobileEntityCard.Header
        leading={
          hidePatientName ? (
            <div className="min-w-0">
              <EntityId type="order" value={order.orderId} variant="block" />
              {order.orderDate ? (
                <p className={`${TYPE.meta} mt-space-0-5 tabular-nums`}>{formatDateTime(order.orderDate)}</p>
              ) : null}
            </div>
          ) : (
            <Avatar
              primaryText={order.patientName || 'N/A'}
              primaryTextClassName=""
              secondaryText={<EntityId type="order" value={order.orderId} />}
              size="xs"
            />
          )
        }
        trailing={<div className={CARD_PRICE}>{formatCurrency(order.totalPrice)}</div>}
      />

      {hasTests && (
        <div className="min-w-0 grow">
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
        {hidePatientName ? (
          <div className="flex items-center gap-space-2 shrink-0 flex-wrap">
            {order.overallStatus && <OrderStatusBadge status={order.overallStatus} size="xs" />}
            {order.paymentStatus && <PaymentStatusBadge status={order.paymentStatus} size="xs" />}
          </div>
        ) : (
          <>
            <div className={`${TYPE.meta} tabular-nums`}>{formatDateTime(order.orderDate)}</div>
            <div className="flex items-center gap-space-2 shrink-0">
              {order.overallStatus && <OrderStatusBadge status={order.overallStatus} size="xs" />}
              {order.paymentStatus && <PaymentStatusBadge status={order.paymentStatus} size="xs" />}
            </div>
          </>
        )}
      </div>
    </MobileEntityCard>
  );
}
