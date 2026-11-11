/**
 * Header-aside skeleton for Panel loading chrome. Body placeholders live on FieldsPlaceholder.
 */

import { Skeleton } from '@/components/feedback';

/** Compact bar reserved for header actions while the panel body is a FieldsPlaceholder. */
export function PanelHeaderAsidePlaceholder({ width = 56 }: { width?: number }) {
  return <Skeleton height={14} width={width} aria-hidden />;
}
