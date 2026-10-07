/**
 * Renders canonical primary status and optional secondary reason from API presentation.
 */
import { Badge, type BadgeProps } from '@/components';
import type { BadgeColor } from '@/components/primitives/badgeTypes';
import {
  PRESENTATION_BADGE_VARIANTS,
  PRESENTATION_DISPLAY_LABELS,
  type CanonicalPresentationPrimary,
} from '@/types/generated/statusPresentation';
import type { StatusPresentation } from '@/types/labProjection';

type StackProps = {
  presentation: StatusPresentation;
  size?: BadgeProps['size'];
  className?: string;
};

function resolveVariant(presentation: StatusPresentation): BadgeColor {
  const key = presentation.primary as CanonicalPresentationPrimary;
  const fromContract = PRESENTATION_BADGE_VARIANTS[key];
  const variant = fromContract ?? presentation.variant;
  return variant as BadgeColor;
}

function resolvePrimaryLabel(presentation: StatusPresentation): string {
  const key = presentation.primary as CanonicalPresentationPrimary;
  return PRESENTATION_DISPLAY_LABELS[key] ?? String(presentation.primary).replace(/-/g, ' ').toUpperCase();
}

export function StatusPresentationBadge({ presentation, size = 'xs', className }: StackProps) {
  return (
    <Badge
      size={size}
      variant={resolveVariant(presentation)}
      label={resolvePrimaryLabel(presentation)}
      className={className}
    />
  );
}

/** Single badge for tight table cells: reason when present, otherwise canonical status. */
export function StatusPresentationCompactBadge({
  presentation,
  size = 'xs',
  className,
}: StackProps) {
  const secondary = presentation.secondary?.trim();
  const label = secondary ?? resolvePrimaryLabel(presentation);
  return (
    <Badge
      size={size}
      variant={resolveVariant(presentation)}
      label={label}
      className={`max-w-full truncate ${className ?? ''}`}
    />
  );
}

export interface StatusPresentationStackProps extends StackProps {
  secondarySize?: BadgeProps['size'];
}

/** Primary canonical badge plus optional secondary reason chip. */
export function StatusPresentationStack({
  presentation,
  size = 'xs',
  secondarySize = 'xs',
  className,
}: StatusPresentationStackProps) {
  const secondary = presentation.secondary?.trim();
  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-space-1 ${className ?? ''}`}>
      <StatusPresentationBadge presentation={presentation} size={size} />
      {secondary ? (
        <Badge size={secondarySize} variant="warning" className="max-w-full truncate font-normal">
          {secondary}
        </Badge>
      ) : null}
    </div>
  );
}
