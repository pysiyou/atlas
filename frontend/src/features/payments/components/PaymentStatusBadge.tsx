/**
 * Payment-domain status and method chips.
 */

import { StatusValueBadge, type StatusValueBadgeProps } from '@/features/shared/components/StatusValueBadge';
import type { PaymentMethod, PaymentStatus } from '@/types';

export function PaymentStatusBadge({
  status,
  ...props
}: Omit<StatusValueBadgeProps, 'value'> & { status: PaymentStatus | string }) {
  return <StatusValueBadge value={status} {...props} />;
}

export function PaymentMethodBadge({
  method,
  ...props
}: Omit<StatusValueBadgeProps, 'value'> & { method: PaymentMethod | string }) {
  return <StatusValueBadge value={method} {...props} />;
}
