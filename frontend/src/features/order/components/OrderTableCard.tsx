import { Badge, Avatar } from '@/shared/ui';
import type { CardComponentProps } from '@/shared/ui/Table';
import { formatCurrency, formatDate } from '@/utils';
import { displayId } from '@/utils';
import type { Order } from '@/types';

export function OrderTableCard({ item: order, onClick }: CardComponentProps<Order>) {
  // Filter out superseded and removed tests - only show active tests
  const activeTests = order.tests.filter(t => t.status !== 'superseded' && t.status !== 'removed');

  return (
    <div
      onClick={onClick}
      className="bg-panel border border-stroke rounded-md p-3 duration-200 cursor-pointer flex flex-col h-full"
    >
      {/* Header: Avatar (top left) + Total Price (top right) */}
      <div className="flex justify-between items-start mb-3 pb-3 border-b border-stroke">
        {/* Avatar: Patient name + Order ID - positioned at top left */}
        <Avatar
          primaryText={order.patientName || 'N/A'}
          primaryTextClassName="font-semibold"
          secondaryText={displayId.order(order.orderId)}
          secondaryTextClassName="font-mono text-brand"
          size="xs"
        />
        {/* Total price on top right */}
        <div className="font-medium text-fg text-lg">{formatCurrency(order.totalPrice)}</div>
      </div>

      {/* Tests list: Show at most 2 tests, third line shows remaining count */}
      <div className="grow">
        {activeTests.length > 0 && (
          <div className="space-y-1">
            {/* Display first 2 tests */}
            {activeTests.slice(0, 2).map((test, index) => (
              <div
                key={test.testCode || index}
                className="flex items-center justify-between text-xs text-fg-muted"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <span className="w-1 h-1 rounded-full bg-neutral-400 mr-2 shrink-0" />
                  <span className="font-medium mr-1 truncate">{test.testName}</span>
                  <span className="font-mono text-brand truncate">{test.testCode}</span>
                </div>
                <span className="font-medium text-fg ml-2 shrink-0">
                  {formatCurrency(test.priceAtOrder)}
                </span>
              </div>
            ))}
            {/* Third line: Show remaining tests count if more than 2 */}
            {activeTests.length > 2 && (
              <div className="text-xs text-fg-subtle">
                +{activeTests.length - 2} more test{activeTests.length - 2 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom section: Order date (left) + Payment status + Order status badges (right) */}
      <div className="flex justify-between items-center mt-auto pt-3">
        {/* Order date on bottom left */}
        <div className="text-xs text-fg-subtle">{formatDate(order.orderDate)}</div>
        {/* Payment status and Order status badges on bottom right */}
        <div className="flex items-center gap-2">
          {order.paymentStatus && <Badge variant={order.paymentStatus} size="xs" />}
          {order.overallStatus && <Badge variant={order.overallStatus} size="xs" />}
        </div>
      </div>
    </div>
  );
}
