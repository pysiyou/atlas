import { Badge, Avatar } from '@/shared/ui';
import type { CardComponentProps } from '@/shared/ui/Table';
import { formatCurrency, formatDate } from '@/utils';
import { displayId } from '@/utils/id-display';
import type { OrderPaymentDetails } from '../../types/types';
import { PaymentButton } from '../display/PaymentButton';
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
      className="bg-surface border border-border rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col h-full"
    >
      {/* Header: Avatar (top left) + Total Price (top right) */}
      <div className="mb-3 pb-3 border-b border-border flex justify-between items-center">
        {/* Avatar: Patient name + Order ID - positioned at top left */}
        <Avatar
          primaryText={item.patientName || 'N/A'}
          secondaryText={displayId.order(item.orderId)}
          secondaryTextClassName="font-mono"
          size="xs"
        />
        {/* Total price on top right */}
        <div className="font-medium text-brand text-lg">{formatCurrency(item.totalPrice)}</div>
      </div>

      {/* Tests list: Show at most 2 tests, third line shows remaining count */}
      <div className="space-y-2">
        {item.tests && item.tests.length > 0 && (
          <div className="space-y-1">
            {/* Display first 2 tests */}
            {item.tests.slice(0, 2).map((test, index) => (
              <div
                key={test.testCode || index}
                className="flex items-center justify-between text-sm text-text-secondary"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mr-2 flex-shrink-0" />
                  <span className="font-medium mr-1 truncate">{test.testName}</span>
                  <span className="text-text-muted truncate">{test.testCode}</span>
                </div>
                <span className="font-medium text-text-muted ml-2 flex-shrink-0">
                  {formatCurrency(test.priceAtOrder)}
                </span>
              </div>
            ))}
            {/* Third line: Show remaining tests count if more than 2 */}
            {item.tests.length > 2 && (
              <div className="text-sm text-text-secondary">
                +{item.tests.length - 2} more test{item.tests.length - 2 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom section: Date (left) + Payment method/button (right) */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
        {/* Date on bottom left - show payment date if paid, otherwise order date */}
        <div className="text-sm text-text-secondary">
          {item.paymentDate ? formatDate(item.paymentDate) : formatDate(item.orderDate)}
        </div>
        {/* Payment method or Payment button on bottom right */}
        {item.paymentMethod && item.paymentStatus !== 'unpaid' ? (
          <Badge variant={item.paymentMethod} size="xs" />
        ) : item.paymentStatus === 'unpaid' ? (
          <div onClick={e => e.stopPropagation()}>
            <PaymentButton order={item._order} size="xs" onPaymentSuccess={handlePaymentSuccess} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
