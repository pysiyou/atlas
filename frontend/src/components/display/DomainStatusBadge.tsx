/**
 * Shared status/category chip used by catalog, lab, payment, and patient badges.
 */

import { Badge, type BadgeProps } from '@/components/primitives';
import { formatStatusBadgeLabel, resolveStatusBadgeColor } from '@/utils/statusBadge';

export type DomainBadgeProps = Omit<BadgeProps, 'variant' | 'label' | 'children'>;

export interface DomainStatusBadgeProps extends DomainBadgeProps {
  /** Raw domain value (status, category, sample type, gender, …). */
  value: string;
}

/**
 * Renders a Badge whose color and label come from the shared statusBadge maps.
 */
export function DomainStatusBadge({ value, ...props }: DomainStatusBadgeProps) {
  return (
    <Badge variant={resolveStatusBadgeColor(value)} label={formatStatusBadgeLabel(value)} {...props} />
  );
}
