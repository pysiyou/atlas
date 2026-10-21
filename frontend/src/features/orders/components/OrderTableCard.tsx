import { Avatar } from '@/components/primitives';
import { ListCard } from '@/components/surfaces';
import { RecordId } from '@/features/shared';
import { renderTableSecondaryRecordId } from '@/utils/presentationRenders';
import type { CardComponentProps } from '@/components/data-table';
import { OrderStatusBadge } from './OrderDomainBadges';
import { StatusValueBadge } from '@/features/shared';
import { renderOrderTestsBlock } from '@/features/orders';
import { useTestNameLookup } from '@/features/catalog';
import { formatCurrency, formatDateTime } from '@/utils';
import { TABLE_DATETIME_SECONDARY_CLASS } from '@/utils/tableColumnRenders';
import { getActiveTests } from '../utils/orderCalculator';
import type { Order } from '@/types';
import { CardFooter, Text } from '@/components/layout';


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
    <ListCard onPress={onClick}>
      <ListCard.Header
        leading={
          hidePatientName ? (
            <div className="min-w-0">
              <RecordId type="order" value={order.orderId} emphasis="block" />
              {order.orderDate ? (
                <p className={`${TABLE_DATETIME_SECONDARY_CLASS} mt-space-0-5`}>{formatDateTime(order.orderDate)}</p>
              ) : null}
            </div>
          ) : (
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
          )
        }
        trailing={
          <Text role="amount" className="leading-none">{formatCurrency(order.totalPrice)}</Text>
        }
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

      <CardFooter align={hidePatientName ? 'end' : 'between'}>
        {hidePatientName ? (
          <div className="flex items-center gap-space-2 shrink-0 flex-wrap">
            {order.overallStatus && (
              <OrderStatusBadge
                status={order.overallStatus}
                presentation={order.statusPresentation}
                size="xs"
              />
            )}
            {order.paymentStatus && <StatusValueBadge value={order.paymentStatus} size="xs" />}
          </div>
        ) : (
          <>
            <div className={TABLE_DATETIME_SECONDARY_CLASS}>
              <RecordId type="order" value={order.orderId} emphasis="mutedBlock" />
              <span className="block mt-space-0-5">{formatDateTime(order.orderDate)}</span>
            </div>
            <div className="flex items-center gap-space-2 shrink-0">
              {order.overallStatus && (
                <OrderStatusBadge
                  status={order.overallStatus}
                  presentation={order.statusPresentation}
                  size="xs"
                />
              )}
              {order.paymentStatus && <StatusValueBadge value={order.paymentStatus} size="xs" />}
            </div>
          </>
        )}
      </CardFooter>
    </ListCard>
  );
}
