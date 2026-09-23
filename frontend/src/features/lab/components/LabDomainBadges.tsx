/**
 * Lab queue / sample domain badges.
 */

import { Badge, type BadgeProps } from '@/components';
import { formatStatusBadgeLabel, resolveStatusBadgeColor } from '@/utils/statusBadge';

type DomainBadgeProps = Omit<BadgeProps, 'variant' | 'label' | 'children'>;

export function SampleStatusBadge({ status, ...props }: DomainBadgeProps & { status: string }) {
  return (
    <Badge
      variant={resolveStatusBadgeColor(status)}
      label={formatStatusBadgeLabel(status)}
      {...props}
    />
  );
}

export function SampleTypeBadge({ sampleType, ...props }: DomainBadgeProps & { sampleType: string }) {
  return (
    <Badge
      variant={resolveStatusBadgeColor(sampleType)}
      label={formatStatusBadgeLabel(sampleType)}
      {...props}
    />
  );
}

export function LabPriorityBadge({ priority, ...props }: DomainBadgeProps & { priority: string }) {
  return (
    <Badge
      variant={resolveStatusBadgeColor(priority)}
      label={formatStatusBadgeLabel(priority)}
      {...props}
    />
  );
}

export function LabDepartmentBadge({ department, ...props }: DomainBadgeProps & { department: string }) {
  return (
    <Badge
      variant={resolveStatusBadgeColor(department)}
      label={formatStatusBadgeLabel(department)}
      {...props}
    />
  );
}
