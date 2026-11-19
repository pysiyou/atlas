/**
 * Traffic-light specimen volume status after lab receive (received vs min/optimal).
 */
import { Badge } from '@/components/primitives';
import type { SpecimenVolumeStatus } from '../utils/labSample';

const COPY: Record<
  SpecimenVolumeStatus,
  { label: string; variant: 'danger' | 'warning' | 'success' | 'neutral' }
> = {
  insufficient: {
    label: 'Insufficient volume',
    variant: 'danger',
  },
  short_sample: {
    label: 'Short sample — no repeat/reflex reserve',
    variant: 'warning',
  },
  optimal: {
    label: 'Optimal volume',
    variant: 'success',
  },
  no_requirement: {
    label: 'Volume',
    variant: 'neutral',
  },
};

export function SpecimenVolumeStatusBadge({
  status,
}: {
  status: SpecimenVolumeStatus | null | undefined;
}) {
  if (!status || status === 'no_requirement') {
    return null;
  }
  const { label, variant } = COPY[status];
  return (
    <Badge variant={variant} uppercase={false}>
      {label}
    </Badge>
  );
}