/**
 * Catalog test metadata badges (category, sample type, lifecycle status).
 */

import { Badge, type BadgeProps } from '@/components';
import { formatStatusBadgeLabel, resolveStatusBadgeColor } from '@/utils/statusBadge';

type DomainBadgeProps = Omit<BadgeProps, 'variant' | 'label' | 'children'>;

export function CatalogCategoryBadge({ category, ...props }: DomainBadgeProps & { category: string }) {
  return (
    <Badge
      variant={resolveStatusBadgeColor(category)}
      label={formatStatusBadgeLabel(category)}
      {...props}
    />
  );
}

export function CatalogSampleTypeBadge({
  sampleType,
  ...props
}: DomainBadgeProps & { sampleType: string }) {
  return (
    <Badge
      variant={resolveStatusBadgeColor(sampleType)}
      label={formatStatusBadgeLabel(sampleType)}
      {...props}
    />
  );
}

export function CatalogTestStatusBadge({ status, ...props }: DomainBadgeProps & { status: string }) {
  return (
    <Badge
      variant={resolveStatusBadgeColor(status)}
      label={formatStatusBadgeLabel(status)}
      {...props}
    />
  );
}
