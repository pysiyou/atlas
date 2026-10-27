/**
 * Default Card body placeholders.
 */

import type { ReactNode } from 'react';
import { Skeleton, SkeletonText } from '@/components/feedback';
import { RADIUS } from '@/theme/recipes';

export type CardLoadingVariant = 'default' | 'metric' | 'banner';

export interface CardLoadingOptions {
  variant?: CardLoadingVariant;
  content?: ReactNode;
}

const METRIC_ICON_BOX = `p-space-3 ${RADIUS.field} shrink-0`;

export function CardLoadingBody({ variant = 'default', content }: CardLoadingOptions) {
  if (content != null) return content;

  if (variant === 'metric') {
    return (
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <Skeleton height={14} width="55%" className="mb-space-1" />
          <Skeleton height={36} width="45%" className="mb-space-1" />
          <Skeleton height={14} width="38%" />
        </div>
        <Skeleton className={`${METRIC_ICON_BOX} h-14 w-14`} />
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="flex items-center gap-space-3">
        <Skeleton className="h-6 w-6 shrink-0" />
        <div className="flex-1 space-y-space-1">
          <Skeleton height={16} width={160} />
          <Skeleton height={14} width={220} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-space-2">
      <Skeleton height={20} width="40%" />
      <SkeletonText lines={3} />
    </div>
  );
}
