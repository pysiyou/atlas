/**
 * Patient demographic badge (gender maps via statusBadge misc colors).
 */

import { Badge, type BadgeProps } from '@/components';
import { formatStatusBadgeLabel, resolveStatusBadgeColor } from '@/utils/statusBadge';

type DomainBadgeProps = Omit<BadgeProps, 'variant' | 'label' | 'children'>;

export function PatientGenderBadge({
  gender,
  ...props
}: DomainBadgeProps & { gender: string }) {
  const key = gender?.trim() ? gender : 'neutral';
  return (
    <Badge
      variant={resolveStatusBadgeColor(key)}
      label={formatStatusBadgeLabel(key)}
      className="capitalize"
      uppercase={false}
      {...props}
    />
  );
}
