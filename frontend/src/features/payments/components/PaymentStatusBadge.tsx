/**
 * Payment-domain status and method chips.
 */

import { DomainStatusBadge, type DomainBadgeProps } from '@/components/display/DomainStatusBadge';
import type { PaymentMethod, PaymentStatus } from '@/types';

export function PaymentStatusBadge({
  status,
  ...props
}: DomainBadgeProps & { status: PaymentStatus | string }) {
  return <DomainStatusBadge value={status} {...props} />;
}

export function PaymentMethodBadge({
  method,
  ...props
}: DomainBadgeProps & { method: PaymentMethod | string }) {
  return <DomainStatusBadge value={method} {...props} />;
}
