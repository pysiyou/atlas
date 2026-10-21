/**
 * Compact placeholder for modal bodies while data or lazy chunks load.
 */

import React from 'react';
import { RADIUS } from '@/components/theme/recipes';
import { Skeleton, SkeletonText } from './Skeleton';

export interface ModalBodySkeletonProps {
  className?: string;
  'aria-label'?: string;
}

export const ModalBodySkeleton: React.FC<ModalBodySkeletonProps> = ({
  className = '',
  'aria-label': ariaLabel = 'Loading',
}) => (
  <div className={`space-y-space-5 ${className}`.trim()} aria-busy="true" aria-label={ariaLabel}>
    <SkeletonText lines={2} />
    <Skeleton height={120} className={`w-full ${RADIUS.field}`} />
    <Skeleton height={160} className={`w-full ${RADIUS.field}`} />
  </div>
);
