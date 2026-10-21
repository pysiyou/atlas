/**
 * Lab queue / sample domain badges.
 */

import { StatusValueBadge, type StatusValueBadgeProps } from '@/features/shared';

type BadgeShellProps = Omit<StatusValueBadgeProps, 'value'>;

export function SampleStatusBadge({ status, ...props }: BadgeShellProps & { status: string }) {
  return <StatusValueBadge value={status} {...props} />;
}

export function SampleTypeBadge({ sampleType, ...props }: BadgeShellProps & { sampleType: string }) {
  return <StatusValueBadge value={sampleType} {...props} />;
}

export function LabPriorityBadge({ priority, ...props }: BadgeShellProps & { priority: string }) {
  return <StatusValueBadge value={priority} {...props} />;
}

export function LabDepartmentBadge({ department, ...props }: BadgeShellProps & { department: string }) {
  return <StatusValueBadge value={department} {...props} />;
}
