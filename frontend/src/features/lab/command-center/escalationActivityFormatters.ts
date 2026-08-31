/**
 * Escalation resolution category activity formatters.
 */
import type { LabOperationRecord } from '@/types/lab-operations';
import type { ActivityLines } from './activityTypes';

export function formatEscalationResolutionAuthorizeRetest(
  _log: LabOperationRecord,
  performer: string
): ActivityLines {
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'resolved an escalation with outcome' },
      { type: 'badge', value: 'Authorized retest', variant: 'authorize_retest' },
    ],
    [{ type: 'text', value: 'Retest approved; same sample may be retested.' }],
  ];
}

export function formatEscalationResolutionFinalReject(
  _log: LabOperationRecord,
  performer: string
): ActivityLines {
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'resolved an escalation with outcome' },
      { type: 'badge', value: 'Final rejection', variant: 'rejected' },
    ],
    [{ type: 'text', value: 'Result finally rejected; no further action.' }],
  ];
}
