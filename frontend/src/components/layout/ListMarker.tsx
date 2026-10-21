import { LIST_MARKER } from '@/theme/recipes';
import { cn } from '@/utils/cn';

export type ListMarkerVariant = 'dot' | 'dotDanger';

const VARIANT_CLASS: Record<ListMarkerVariant, string> = {
  dot: LIST_MARKER.dot,
  dotDanger: LIST_MARKER.dotDanger,
};

export interface ListMarkerProps {
  variant?: ListMarkerVariant;
  className?: string;
}

/** Visual bullet for metadata rows and compact lists. */
export function ListMarker({ variant = 'dot', className }: ListMarkerProps) {
  return <span aria-hidden className={cn(VARIANT_CLASS[variant], className)} />;
}

export interface InlineSeparatorProps {
  className?: string;
}

export function InlineSeparator({ className }: InlineSeparatorProps) {
  return (
    <span className={cn(LIST_MARKER.inlineSeparator, className)} aria-hidden>
      {LIST_MARKER.inlineDot}
    </span>
  );
}
