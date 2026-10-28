/**
 * Domain adapter: API status presentation → generic BadgeStack.
 */

import { BadgeStack, type BadgeStackProps } from '@/components/display/BadgeStack';
import type { BadgeColor } from '@/components/primitives/badgeTypes';
import {
  PRESENTATION_BADGE_VARIANTS,
  PRESENTATION_DISPLAY_LABELS,
  type CanonicalPresentationPrimary,
} from '@/types/enums/generated/presentation';
import type { StatusPresentation } from '@/types/labProjection';
import { Text } from '@/components/layout/Text';
import { PRESENTATION_STACK_CLASS } from '@/theme/recipes';
import { Badge } from '@/components/primitives';

function resolveIntent(presentation: StatusPresentation): BadgeColor {
  const key = presentation.primary as CanonicalPresentationPrimary;
  const fromContract = PRESENTATION_BADGE_VARIANTS[key];
  const variant = fromContract ?? presentation.variant;
  return variant as BadgeColor;
}

function resolvePrimaryLabel(presentation: StatusPresentation): string {
  const key = presentation.primary as CanonicalPresentationPrimary;
  return PRESENTATION_DISPLAY_LABELS[key] ?? String(presentation.primary).replace(/-/g, ' ').toUpperCase();
}

type BaseProps = {
  presentation: StatusPresentation;
  size?: BadgeStackProps['primary']['size'];
  className?: string;
};

export function LabPresentationBadge({ presentation, size = 'xs', className }: BaseProps) {
  return (
    <BadgeStack
      className={className}
      primary={{ label: resolvePrimaryLabel(presentation), intent: resolveIntent(presentation), size }}
    />
  );
}

export function LabPresentationTableCell({ presentation, size = 'xs', className }: BaseProps) {
  const secondary = presentation.secondary?.trim();
  return (
    <div className={`${PRESENTATION_STACK_CLASS} ${className ?? ''}`}>
      <LabPresentationBadge presentation={presentation} size={size} />
      {secondary ? (
        <Text as="div" role="caption" intent="muted" truncate className="max-w-full" title={secondary}>
          {secondary}
        </Text>
      ) : null}
    </div>
  );
}

export function LabPresentationCompactBadge({ presentation, size = 'xs', className }: BaseProps) {
  const secondary = presentation.secondary?.trim();
  const label = secondary ?? resolvePrimaryLabel(presentation);
  return (
    <Badge
      size={size}
      variant={resolveIntent(presentation)}
      label={label}
      className={`max-w-full truncate ${className ?? ''}`}
    />
  );
}

export function LabPresentationStack({
  presentation,
  size = 'xs',
  secondarySize = 'xs',
  className,
}: BaseProps & { secondarySize?: BadgeStackProps['primary']['size'] }) {
  const secondary = presentation.secondary?.trim();
  return (
    <BadgeStack
      className={className}
      layout="inline"
      primary={{ label: resolvePrimaryLabel(presentation), intent: resolveIntent(presentation), size }}
      secondary={secondary ? { label: secondary, intent: 'warning', size: secondarySize } : undefined}
    />
  );
}

