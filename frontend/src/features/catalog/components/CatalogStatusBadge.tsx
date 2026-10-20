/**
 * Catalog test metadata badges (category, sample type, lifecycle status).
 */

import { DomainStatusBadge, type DomainBadgeProps } from '@/components/display/DomainStatusBadge';

export function CatalogCategoryBadge({ category, ...props }: DomainBadgeProps & { category: string }) {
  return <DomainStatusBadge value={category} {...props} />;
}

export function CatalogSampleTypeBadge({
  sampleType,
  ...props
}: DomainBadgeProps & { sampleType: string }) {
  return <DomainStatusBadge value={sampleType} {...props} />;
}

export function CatalogTestStatusBadge({ status, ...props }: DomainBadgeProps & { status: string }) {
  return <DomainStatusBadge value={status} {...props} />;
}
