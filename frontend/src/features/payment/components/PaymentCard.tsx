import { Badge, Avatar } from '@/shared/ui';
import type { CardComponentProps } from '@/shared/ui/Table';
import { formatCurrency, formatDate } from '@/utils';
import { displayId } from '@/utils';
// OrderPaymentDetails type
type OrderPaymentDetails = {
  orderId: number;
  orderDate: string;
  patientId: number;
  patientName: string;
  tests: Array<{
    testName: string;
    priceAtOrder: number;
    status?: string;
    testCode?: string;
  }>;
  totalPrice: number;
  paymentStatus: string;
  paymentMethod?: string;
  paymentDate?: string;
  order: any;
  payment?: {
    paymentId: number;
    paymentMethod: string;
    amount: number;
    paidAt: string;
  };
};
import { PaymentButton } from './PaymentButton';
import { useInvalidatePayments } from '@/hooks/queries/usePayments';

/**
 * PaymentCard Component
 *
 * Custom mobile card component for payment data.
 * Displays payment information in a mobile-friendly card layout.
 *
 * @param item - OrderPaymentDetails data
 * @param index - Index of the item in the list
 * @param onClick - Optional click handler
 */
export function PaymentCard({ item, onClick }: CardComponentProps<OrderPaymentDetails>) {
  const { invalidateAll } = useInvalidatePayments();

  const handlePaymentSuccess = () => {
    // Invalidate payment and order caches to refresh the data
    invalidateAll();
  };

  return (
    <div
      onClick={onClick}
      className="bg-surface-default border border-border-default rounded-md p-3 duration-200 cursor-pointer flex flex-col h-full"
    >
      {/* Header: Avatar (top left) + Total Price (top right) */}
      <div className="pb-3 border-b border-border-default flex justify-between items-center">
        {/* Avatar: Patient name + Order ID - positioned at top left */}
        <Avatar
          primaryText={item.patientName || 'N/A'}
          primaryTextClassName="font-semibold"
          secondaryText={displayId.order(item.orderId)}
          secondaryTextClassName="font-mono text-action-primary"
          size="xs"
        />
        {/* Total price on top right */}
        <div className="font-medium text-action-primary text-lg">{formatCurrency(item.totalPrice)}</div>
      </div>

      {/* Tests list: Show at most 2 tests, third line shows remaining count */}
      <div className="space-y-2 pt-3">
        {item.tests && item.tests.length > 0 && (
          <div className="space-y-1">
            {/* Display first 2 tests */}
            {item.tests.slice(0, 2).map((test, index) => (
              <div
                key={test.testCode || index}
                className="flex items-center justify-between text-xs text-text-secondary"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <span className="w-1 h-1 rounded-full bg-neutral-400 mr-2 flex-shrink-0" />
                  <span className="font-medium mr-1 truncate">{test.testName}</span>
                  <span className="text-action-primary font-mono truncate">{test.testCode}</span>
                </div>
                <span className="font-medium text-action-primary ml-2 flex-shrink-0">
                  {formatCurrency(test.priceAtOrder)}
                </span>
              </div>
            ))}
            {/* Third line: Show remaining tests count if more than 2 */}
            {item.tests.length > 2 && (
              <div className="text-xs text-text-tertiary">
                +{item.tests.length - 2} more test{item.tests.length - 2 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom section: Date (left) + Payment method/button (right) */}
      <div className="flex justify-between items-center pt-3">
        {/* Date on bottom left - show payment date if paid, otherwise order date */}
        <div className="text-xs text-text-tertiary">
          {item.paymentDate ? formatDate(item.paymentDate) : formatDate(item.orderDate)}
        </div>
        {/* Payment method or Payment button on bottom right */}
        {item.paymentMethod && item.paymentStatus !== 'unpaid' ? (
          <Badge variant={item.paymentMethod} size="xs" />
        ) : item.paymentStatus === 'unpaid' ? (
          <div onClick={e => e.stopPropagation()}>
            <PaymentButton order={item.order} size="xs" onPaymentSuccess={handlePaymentSuccess} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
