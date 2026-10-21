/**
 * Order-domain status chips — color/label from @/utils/statusBadge.
 */

import { Badge, type BadgeProps } from '@/components/primitives';
import {
  LabPresentationCompactBadge,
  LabPresentationStack,
} from '@/features/lab/components/LabPresentationBadge';
import type { OrderStatus, OrderTest, PriorityLevel } from '@/types';
import type { StatusPresentation } from '@/types/labProjection';
import { formatStatusBadgeLabel, resolveStatusBadgeColor } from '@/utils/statusBadge';

type DomainBadgeProps = Omit<BadgeProps, 'variant' | 'label' | 'children'>;

export type StatusPresentationLayout = 'stack' | 'compact';

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
  if (presentation) {
    if (layout === 'compact') {
      return (
        <LabPresentationCompactBadge
          presentation={presentation}
          size={props.size}
          className={props.className}
        />
      );
    }
    return <LabPresentationStack presentation={presentation} size={props.size} />;
  }
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
  presentation,
  layout = 'stack',
  ...props
}: DomainBadgeProps & {
  status: OrderTest['status'] | string;
  presentation?: StatusPresentation | null;
  layout?: StatusPresentationLayout;
}) {
  if (presentation) {
    if (layout === 'compact') {
      return (
        <LabPresentationCompactBadge
          presentation={presentation}
          size={props.size}
          className={props.className}
        />
      );
    }
    return <LabPresentationStack presentation={presentation} size={props.size} />;
  }
  return (
    <Badge
      variant={resolveStatusBadgeColor(status)}
      label={formatStatusBadgeLabel(status)}
      {...props}
    />
  );
}
