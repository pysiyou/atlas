/**
 * Order-domain status chips — color/label from @/utils/statusBadge.
 */

import { Badge, type BadgeProps } from '@/components';
import type { OrderStatus, OrderTest, PriorityLevel } from '@/types';
import { formatStatusBadgeLabel, resolveStatusBadgeColor } from '@/utils/statusBadge';

type DomainBadgeProps = Omit<BadgeProps, 'variant' | 'label' | 'children'>;

export function OrderStatusBadge({
  status,
  ...props
}: DomainBadgeProps & { status: OrderStatus | string }) {
  return (
    <Badge
      variant={resolveStatusBadgeColor(status)}
      label={formatStatusBadgeLabel(status)}
      {...props}
    />
  );
}

export function OrderPriorityBadge({
  priority,
  ...props
}: DomainBadgeProps & { priority: PriorityLevel | string }) {
  return (
    <Badge
      variant={resolveStatusBadgeColor(priority)}
      label={formatStatusBadgeLabel(priority)}
      {...props}
    />
  );
}

export function OrderTestStatusBadge({
  status,
  ...props
}: DomainBadgeProps & { status: OrderTest['status'] | string }) {
  return (
    <Badge
      variant={resolveStatusBadgeColor(status)}
      label={formatStatusBadgeLabel(status)}
      {...props}
    />
  );
}
