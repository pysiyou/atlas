/**
 * Payment-domain status and method chips.
 */

import { Badge, type BadgeProps } from '@/components';
import type { PaymentMethod, PaymentStatus } from '@/types';
import { formatStatusBadgeLabel, resolveStatusBadgeColor } from '@/utils/statusBadge';

type DomainBadgeProps = Omit<BadgeProps, 'variant' | 'label' | 'children'>;

export function PaymentStatusBadge({
  status,
  ...props
}: DomainBadgeProps & { status: PaymentStatus | string }) {
  return (
    <Badge
      variant={resolveStatusBadgeColor(status)}
      label={formatStatusBadgeLabel(status)}
      {...props}
    />
  );
}

export function PaymentMethodBadge({
  method,
  ...props
}: DomainBadgeProps & { method: PaymentMethod | string }) {
  return (
    <Badge
      variant={resolveStatusBadgeColor(method)}
      label={formatStatusBadgeLabel(method)}
      {...props}
    />
  );
}
