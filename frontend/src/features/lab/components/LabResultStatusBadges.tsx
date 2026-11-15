/**
 * Status chips for retest, recollection, flags, review, and queue blocks.
 */

import { Badge, Icon } from '@/components/primitives';
import { SpinnerLoader } from '@/components/feedback';
import type { BadgeSize } from '@/components/primitives';
import { IconKeys } from '@/icons';
import { ATTENTION_LABELS } from '@/types/generated/policies';
import { BADGE, WORKLIST_CARD_BADGE_SIZE } from '@/theme/recipes';

const badgeIconClass = BADGE.icon.xs;

interface RetestBadgeProps {
  retestNumber: number;
  size?: 'sm' | 'xs';
  className?: string;
}

export function RetestBadge({
  retestNumber,
  size = WORKLIST_CARD_BADGE_SIZE,
  className = '',
}: RetestBadgeProps) { return (
  <Badge size={size} variant="warning" className={className}>
    RE-TEST #{retestNumber}
  </Badge>
); }

interface RecollectionAttemptBadgeProps {
  attemptNumber: number;
  size?: 'sm' | 'xs';
  className?: string;
  showIcon?: boolean;
}

export function RecollectionAttemptBadge({
  attemptNumber,
  size = WORKLIST_CARD_BADGE_SIZE,
  className = '',
  showIcon = false,
}: RecollectionAttemptBadgeProps) { return (
  <Badge size={size} variant="warning" className={`flex items-center gap-space-1 ${className}`}>
    {showIcon && <SpinnerLoader size="xs" />}
    RE-COLLECT #{attemptNumber}
  </Badge>
); }

interface FlagCountBadgeProps {
  count: number;
  size?: 'sm' | 'xs';
  className?: string;
  showIcon?: boolean;
}

export function FlagCountBadge({
  count,
  size = WORKLIST_CARD_BADGE_SIZE,
  className = '',
  showIcon = true,
}: FlagCountBadgeProps) {
  if (count === 0) return null;

  return (
    <Badge size={size} variant="danger" className={`flex items-center gap-space-1-5 ${className}`}>
      {showIcon && <Icon iconKey={IconKeys.actions.warning} className={badgeIconClass} />}
      {count} flag{count !== 1 ? 's' : ''}
    </Badge>
  );
}

interface ReviewRequiredBadgeProps {
  size?: 'sm' | 'xs';
  className?: string;
  showIcon?: boolean;
}

export function ReviewRequiredBadge({
  size = WORKLIST_CARD_BADGE_SIZE,
  className = '',
  showIcon = true,
}: ReviewRequiredBadgeProps) { return (
  <Badge size={size} variant="danger" className={`flex items-center gap-space-1 ${className}`}>
    {showIcon && <Icon iconKey={IconKeys.actions.warning} className={badgeIconClass} />}
    Review Required
  </Badge>
); }

interface AttentionReasonBadgeProps {
  label: string;
  size?: BadgeSize;
  className?: string;
  showIcon?: boolean;
  variant?: 'warning' | 'danger' | 'info';
}

export function AttentionReasonBadge({
  label,
  size = 'xs',
  className = '',
  showIcon = true,
  variant = 'warning',
}: AttentionReasonBadgeProps) { return (
  <Badge
    size={size}
    variant={variant}
    className={`${showIcon ? 'flex items-center gap-space-1' : ''} ${className}`}
  >
    {showIcon ? (
      <Icon iconKey={IconKeys.actions.alertCircle} className={badgeIconClass} />
    ) : null}
    {label}
  </Badge>
); }

interface SupervisorApprovalBadgeProps {
  size?: BadgeSize;
  className?: string;
}

/** Supervisor gate — recollection / authorization queues (not specimen blocked). */
export function SupervisorApprovalBadge({
  size = WORKLIST_CARD_BADGE_SIZE,
  className = '',
}: SupervisorApprovalBadgeProps) { return (
  <AttentionReasonBadge
    label={ATTENTION_LABELS.supervisor_review}
    size={size}
    variant="danger"
    className={className}
  />
); }
