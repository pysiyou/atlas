/**
 * Lab queue / sample domain badges.
 */

import { DomainStatusBadge, type DomainBadgeProps } from '@/components/display/DomainStatusBadge';

export function SampleStatusBadge({ status, ...props }: DomainBadgeProps & { status: string }) {
  return <DomainStatusBadge value={status} {...props} />;
}

export function SampleTypeBadge({ sampleType, ...props }: DomainBadgeProps & { sampleType: string }) {
  return <DomainStatusBadge value={sampleType} {...props} />;
}

export function LabPriorityBadge({ priority, ...props }: DomainBadgeProps & { priority: string }) {
  return <DomainStatusBadge value={priority} {...props} />;
}

export function LabDepartmentBadge({ department, ...props }: DomainBadgeProps & { department: string }) {
  return <DomainStatusBadge value={department} {...props} />;
}
