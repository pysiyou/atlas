/**
 * Catalog test metadata badges (category, sample type, lifecycle status).
 */

import { StatusValueBadge, type StatusValueBadgeProps } from '@/features/shared/components/StatusValueBadge';

export function CatalogCategoryBadge({
  category,
  ...props
}: Omit<StatusValueBadgeProps, 'value'> & { category: string }) {
  return <StatusValueBadge value={category} {...props} />;
}

export function CatalogSampleTypeBadge({
  sampleType,
  ...props
}: Omit<StatusValueBadgeProps, 'value'> & { sampleType: string }) {
  return <StatusValueBadge value={sampleType} {...props} />;
}

export function CatalogTestStatusBadge({
  status,
  ...props
}: Omit<StatusValueBadgeProps, 'value'> & { status: string }) {
  return <StatusValueBadge value={status} {...props} />;
}
