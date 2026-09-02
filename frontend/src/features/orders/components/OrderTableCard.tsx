import { Badge, Avatar, MobileEntityCard } from '@/components';
import type { CardComponentProps } from '@/components';
import { formatCurrency, formatDate } from '@/utils';
import { displayId } from '@/utils';
import { getActiveTests } from '@/features/orders/utils';
import type { Order } from '@/types';

export function OrderTableCard({ item: order, onClick }: CardComponentProps<Order>) {
  const activeTests = getActiveTests(order.tests);

  return (
    <MobileEntityCard onClick={onClick}>
      {/* Header: Avatar (top left) + Total Price (top right) */}
      <div className="flex justify-between items-start mb-3 pb-3 border-b border-border-default">
        {/* Avatar: Patient name + Order ID - positioned at top left */}
        <Avatar
          primaryText={order.patientName || 'N/A'}
          primaryTextClassName=""
          secondaryText={displayId.order(order.orderId)}
          secondaryTextClassName="entity-id"
          size="xs"
        />
        {/* Total price on top right */}
        <div className="text-text-primary text-lg">{formatCurrency(order.totalPrice)}</div>
      </div>

      {/* Tests list: Show at most 2 tests, third line shows remaining count */}
      <div className="grow">
        {activeTests.length > 0 && (
          <div className="space-y-1">
            {/* Display first 2 tests */}
            {activeTests.slice(0, 2).map((test, index) => (
              <div
                key={test.id ?? `${test.testCode}-${index}`}
                className="flex items-center justify-between text-xs text-text-secondary"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <span className="w-1 h-1 rounded-full bg-neutral-400 mr-2 shrink-0" />
                  <span className="mr-1 truncate">{test.testName}</span>
                  <span className="entity-id truncate">{test.testCode}</span>
                </div>
                <span className="text-text-primary ml-2 shrink-0">
                  {formatCurrency(test.priceAtOrder)}
                </span>
              </div>
            ))}
            {/* Third line: Show remaining tests count if more than 2 */}
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
        {/* Order date on bottom left */}
        <div className="text-xs text-text-tertiary">{formatDate(order.orderDate)}</div>
        {/* Payment status and Order status badges on bottom right */}
        <div className="flex items-center gap-2">
          {order.paymentStatus && <Badge variant={order.paymentStatus} size="xs" />}
          {order.overallStatus && <Badge variant={order.overallStatus} size="xs" />}
        </div>
      </div>
    </MobileEntityCard>
  );
}
