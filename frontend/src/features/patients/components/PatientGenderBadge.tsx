/**
 * Patient demographic badge (gender maps via statusBadge misc colors).
 */

import { DomainStatusBadge, type DomainBadgeProps } from '@/components/display/DomainStatusBadge';

export function PatientGenderBadge({
  gender,
  ...props
}: DomainBadgeProps & { gender: string }) {
  const key = gender?.trim() ? gender : 'neutral';
  return <DomainStatusBadge value={key} className="capitalize" uppercase={false} {...props} />;
}
