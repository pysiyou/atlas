import { Badge, Avatar, MobileEntityCard, EntityId } from '@/components';
import type { CardComponentProps } from '@/components';
import { formatCurrency, formatDateTime } from '@/utils';
import type { OrderPaymentView } from '../types';
import { PaymentButton } from './PaymentButton';
import { useInvalidatePayments } from '../api/payments.api';

/**
 * PaymentCard Component
 *
 * Custom mobile card component for payment data.
 * Displays payment information in a mobile-friendly card layout.
 */
export function PaymentCard({ item, onClick }: CardComponentProps<OrderPaymentView>) {
  const { invalidateAll } = useInvalidatePayments();
  const { order } = item;

  const handlePaymentSuccess = () => {
    invalidateAll();
  };

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
      <div className="space-y-2">
        {order.tests && order.tests.length > 0 && (
          <div className="space-y-1">
            {order.tests.slice(0, 2).map((test, index) => (
              <div
                key={test.testCode || index}
                className="flex items-center justify-between text-xs text-text-secondary"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <span className="w-1 h-1 rounded-full bg-neutral-400 mr-2 flex-shrink-0" />
                  <span className="mr-1 truncate">{test.testName}</span>
                  <EntityId variant="inline" className="truncate">
                    {test.testCode}
                  </EntityId>
                </div>
                <span className="text-text-primary ml-2 flex-shrink-0">
                  {formatCurrency(test.priceAtOrder)}
                </span>
              </div>
            ))}
            {order.tests.length > 2 && (
              <div className="text-xs text-text-tertiary">
                +{order.tests.length - 2} more test{order.tests.length - 2 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom section: Date (left) + Payment method/button (right) */}
      <div className="flex justify-between items-center pt-3">
        <div className="text-xs text-text-tertiary">
          {item.paymentDate ? formatDateTime(item.paymentDate) : formatDateTime(order.orderDate)}
        </div>
        {item.paymentMethod && order.paymentStatus !== 'unpaid' ? (
          <Badge variant={item.paymentMethod} size="xs" />
        ) : order.paymentStatus === 'unpaid' ? (
          <div onClick={e => e.stopPropagation()}>
            <PaymentButton order={order} size="sm" onPaymentSuccess={handlePaymentSuccess} />
          </div>
        ) : null}
      </div>
    </MobileEntityCard>
  );
}
