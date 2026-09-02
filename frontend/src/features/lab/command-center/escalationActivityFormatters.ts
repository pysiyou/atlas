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
      { type: 'badge', value: 'Test cancelled', variant: 'cancelled' },
    ],
    [{ type: 'text', value: 'Test cancelled; no further action.' }],
  ];
}


export function formatEscalationResolutionForceValidate(
  _log: LabOperationRecord,
  performer: string
): ActivityLines {
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'resolved an escalation with outcome' },
      { type: 'badge', value: 'Force validated', variant: 'approved' },
    ],
    [{ type: 'text', value: 'Supervisor override; results released.' }],
  ];
}

export function formatEscalationResolutionAuthorizeRecollect(
  _log: LabOperationRecord,
  performer: string
): ActivityLines {
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'resolved an escalation with outcome' },
      { type: 'badge', value: 'Authorized re-collect', variant: 'authorize_recollect' },
    ],
    [{ type: 'text', value: 'New sample and test created for re-collection.' }],
  ];
}
