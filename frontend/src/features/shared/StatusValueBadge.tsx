/**
 * Domain adapter: map raw status/category strings to Badge appearance.
 */

import { Badge, type BadgeProps } from '@/components/primitives';
import { formatStatusBadgeLabel, resolveStatusBadgeColor } from '@/utils/statusBadge';

export type DomainBadgeProps = Omit<BadgeProps, 'variant' | 'label' | 'children'>;

export type StatusValueBadgeProps = DomainBadgeProps & {
  value: string;
};

export function StatusValueBadge({ value, ...props }: StatusValueBadgeProps) {
  return (
    <Badge variant={resolveStatusBadgeColor(value)} label={formatStatusBadgeLabel(value)} {...props} />
  );
}
