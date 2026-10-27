/**
 * Order-domain status chips — color/label from @/utils/statusBadge.
 */

import type { BadgeProps } from '@/components/primitives';
import type { OrderStatus, OrderTest, PriorityLevel } from '@/types';
import type { StatusPresentation } from '@/types/labProjection';
import { Badge } from '@/components/primitives';
import { formatStatusBadgeLabel, resolveStatusBadgeColor } from '@/utils/statusBadge';
import {
  StatusPresentationBadge,
  type StatusPresentationLayout,
} from '@/utils/presentation';

type DomainBadgeProps = Omit<BadgeProps, 'variant' | 'label' | 'children'>;

export type { StatusPresentationLayout };

export function OrderStatusBadge({
  status,
  presentation,
  layout = 'stack',
  ...props
}: DomainBadgeProps & {
  status: OrderStatus | string;
  presentation?: StatusPresentation | null;
  layout?: StatusPresentationLayout;
}) {
  return (
    <StatusPresentationBadge
      status={status}
      presentation={presentation}
      layout={layout}
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
  presentation,
  layout = 'stack',
  ...props
}: DomainBadgeProps & {
  status: OrderTest['status'] | string;
  presentation?: StatusPresentation | null;
  layout?: StatusPresentationLayout;
}) {
  return (
    <StatusPresentationBadge
      status={status}
      presentation={presentation}
      layout={layout}
      {...props}
    />
  );
}
