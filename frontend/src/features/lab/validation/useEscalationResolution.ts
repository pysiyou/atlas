import { useCallback, useMemo } from 'react';
import { notify } from '@/utils/feedback';
import { useAuthStore } from '@/app/authStore';
import { useResolveEscalation } from '../api/results';
import type { EscalationResolutionAction } from '@/types/lab-operations';
import type { EscalationResolveOptions } from './EscalationResolutionActions';

interface UseEscalationResolutionOptions {
  orderTestId: number;
  onResolved: () => void | Promise<void>;
  onClose: () => void;
  onResetForm: () => void;
}

export function useEscalationResolution({
  orderTestId,
  onResolved,
  onClose,
  onResetForm,
}: UseEscalationResolutionOptions) {
  const { hasRole } = useAuthStore();
  const canResolveEscalation = hasRole(['administrator', 'lab-technician-plus']);
  const resolveEscalation = useResolveEscalation();
  const resolving = resolveEscalation.isPending;

  const messages: Record<EscalationResolutionAction, string> = useMemo(
    () => ({
      force_validate: 'Results force-validated.',
      authorize_retest: 'Authorized re-test created.',
      authorize_recollect: 'Re-collect authorized; new sample and test created.',
      apply_amendment: 'Amendment applied and test validated.',
      cancel_test: 'Test cancelled.',
    }),
    [],
  );

  const resolveAsync = useCallback(
    (
      action: EscalationResolutionAction,
      rejectionReasonOrNotes?: string,
      options?: EscalationResolveOptions,
    ): Promise<void> => {
      if (!canResolveEscalation) {
        notify.toast('lab.escalation.permissionDenied');
        return Promise.resolve();
      }
      if (resolving) return Promise.resolve();

      const variables = {
        orderTestId,
        action,
        validationNotes:
          action === 'force_validate' || action === 'apply_amendment'
            ? rejectionReasonOrNotes?.trim()
            : undefined,
        rejectionReason:
          action === 'authorize_retest'
            ? rejectionReasonOrNotes?.trim() || 'Authorized re-test (escalation resolution)'
            : action === 'authorize_recollect' || action === 'cancel_test'
              ? (rejectionReasonOrNotes ?? '').trim()
              : undefined,
        readBack: options?.readBack,
      };

      return resolveEscalation
        .mutateAsync(variables, {
          onSuccess: async () => {
            await onResolved();
            onClose();
            notify.toast('lab.escalation.resolve.success', {
              title: messages[action] ?? 'Operation completed.',
            });
            onResetForm();
          },
          onError: err => {
            notify.apiError('lab.escalation.resolve.error', err);
          },
        })
        .then(() => undefined)
        .catch(() => undefined);
    },
    [
      orderTestId,
      onResolved,
      onClose,
      resolving,
      resolveEscalation,
      canResolveEscalation,
      messages,
      onResetForm,
    ],
  );

  return { canResolveEscalation, resolving, resolveAsync };
}
