/**
 * Supervisor exception queue card — badges and read-only review body (actions in modal).
 */

import { AttemptIndicator } from '../components/LabAttemptIndicators';
import { TestHeaderBadges } from '../components/LabWorkflowBadges';
import { SupervisorApprovalBadge } from '../components/LabResultStatusBadges';
import { deriveRetestContext } from '../utils/deriveRetestContext';
import { text, WORKLIST_CARD_BADGE_SIZE } from '@/theme/recipes';
import type { TestWithContext } from '@/types';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';

function ticketString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

export function EscalationExceptionBadges({ test }: { test: TestWithContext }) {
  const rejection = deriveRetestContext(test);

  return (
    <>
      <SupervisorApprovalBadge size={WORKLIST_CARD_BADGE_SIZE} />
      <TestHeaderBadges test={test} variant="escalation" showStatus />
      {rejection.showAttemptIndicator ? (
        <AttemptIndicator
          attemptNumber={rejection.attemptNumber}
          maxAttempts={rejection.attemptMax}
          type={rejection.attemptType}
        />
      ) : null}
    </>
  );
}

export function EscalationExceptionReviewBody({ test }: { test: TestWithContext }) {
  const rejectionReason = ticketString(test.ticketMetadata?.rejectionReason);
  const rejectionNotes = ticketString(test.ticketMetadata?.rejectionNotes);
  const denyMessage = test.denyMessage ?? test.lab?.denyMessage ?? undefined;
  const reasonCode = test.reasonCode ? formatStatusBadgeLabel(test.reasonCode) : undefined;

  const hasContent = Boolean(reasonCode || denyMessage || rejectionReason || rejectionNotes);
  if (!hasContent) {
    return (
      <p className={text({ role: 'label' })}>Open to review this exception and choose a resolution.</p>
    );
  }

  return (
    <div className={`space-y-space-1 ${text({ role: 'body' })}`}>
      {reasonCode ? (
        <div>
          <span className={text({ role: 'label' })}>Exception:</span>{' '}
          <span className={text({ role: 'body' })}>{reasonCode}</span>
        </div>
      ) : null}
      {denyMessage ? (
        <div>
          <span className={text({ role: 'label' })}>Blocked:</span>{' '}
          <span className={text({ role: 'body' })}>{denyMessage}</span>
        </div>
      ) : null}
      {rejectionReason ? (
        <div>
          <span className={text({ role: 'label' })}>Reason:</span>{' '}
          <span className={text({ role: 'body' })}>{rejectionReason}</span>
        </div>
      ) : null}
      {rejectionNotes ? (
        <div>
          <span className={text({ role: 'label' })}>Notes:</span>{' '}
          <span className={text({ role: 'body' })}>{rejectionNotes}</span>
        </div>
      ) : null}
    </div>
  );
}
