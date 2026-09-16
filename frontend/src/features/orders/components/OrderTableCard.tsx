import { Badge, Avatar, MobileEntityCard, EntityId } from '@/components';
import type { CardComponentProps } from '@/components';
import { formatCurrency, formatDateTime } from '@/utils';
import { getActiveTests } from '../utils/orderCalculator';
import type { Order } from '@/types';

export function OrderTableCard({ item: order, onClick }: CardComponentProps<Order>) {
  const activeTests = getActiveTests(order.tests);

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

      {/* Tests list: Show at most 2 tests, third line shows remaining count */}
      <div className="grow">
        {activeTests.length > 0 && (
          <div className="space-y-1">
            {activeTests.slice(0, 2).map((test, index) => (
              <div
                key={test.id ?? `${test.testCode}-${index}`}
                className="flex items-center justify-between text-xs text-text-secondary"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <span className="w-1 h-1 rounded-full bg-neutral-400 mr-2 shrink-0" />
                  <span className="mr-1 truncate">{test.testName}</span>
                  <EntityId variant="inline" className="truncate">
                    {test.testCode}
                  </EntityId>
                </div>
                <span className="text-text-primary ml-2 shrink-0">
                  {formatCurrency(test.priceAtOrder)}
                </span>
              </div>
            ))}
            {activeTests.length > 2 && (
              <div className="text-xs text-text-tertiary">
                +{activeTests.length - 2} more test{activeTests.length - 2 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom section: Order date (left) + Payment status + Order status badges (right) */}
      <div className="flex justify-between items-center mt-auto pt-3">
        <div className="text-xs text-text-tertiary">{formatDateTime(order.orderDate)}</div>
        <div className="flex items-center gap-2">
          {order.paymentStatus && <Badge variant={order.paymentStatus} size="xs" />}
          {order.overallStatus && <Badge variant={order.overallStatus} size="xs" />}
        </div>
      </div>
    </MobileEntityCard>
  );
}
