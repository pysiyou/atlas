import { Badge, Avatar, MobileEntityCard, EntityId } from '@/components';
import type { CardComponentProps } from '@/components';
import { renderOrderTestsBlock } from '@/components/data-table';
import { useTestNameLookup } from '@/features/catalog';
import { formatCurrency, formatDateTime } from '@/utils';
import { getActiveTests } from '../utils/orderCalculator';
import type { Order } from '@/types';
import { TYPE } from '@/components/theme/recipes';


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
            <EntityId type="order" value={order.orderId} variant="block" />
          ) : (
            <Avatar
              primaryText={order.patientName || 'N/A'}
              primaryTextClassName=""
              secondaryText={<EntityId type="order" value={order.orderId} />}
              size="xs"
            />
          )
        }
        trailing={<div className="text-text-primary text-lg">{formatCurrency(order.totalPrice)}</div>}
      />

      {hasTests && (
        <div className="min-w-0 grow">
          {renderOrderTestsBlock(activeTests, {
            fallbackCount:
              order.testCount != null && activeTests.length === 0 ? order.testCount : undefined,
            testCodes: activeTests.length === 0 ? order.testCodes : undefined,
            getTestName,
          })}
        </div>
      )}

      <div className="flex justify-between items-center mt-auto pt-space-3 gap-space-2">
        <div className={`${TYPE.meta} tabular-nums`}>{formatDateTime(order.orderDate)}</div>
        <div className="flex items-center gap-space-2 shrink-0">
          {order.overallStatus && <Badge variant={order.overallStatus} size="xs" />}
          {order.paymentStatus && <Badge variant={order.paymentStatus} size="xs" />}
        </div>
      </div>
    </MobileEntityCard>
  );
}
