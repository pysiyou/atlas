/**
 * Patient demographic badge (gender maps via statusBadge misc colors).
 */

import { StatusValueBadge, type StatusValueBadgeProps } from '@/features/shared/components/StatusValueBadge';

export function PatientGenderBadge({
  gender,
  ...props
}: Omit<StatusValueBadgeProps, 'value'> & { gender: string }) {
  const key = gender?.trim() ? gender : 'neutral';
  return <StatusValueBadge value={key} className="capitalize" uppercase={false} {...props} />;
}
