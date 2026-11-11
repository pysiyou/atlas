import { useCallback } from 'react';
import { notify } from '@/feedback';
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

  const resolveAsync = useCallback(
    (
      action: EscalationResolutionAction,
      rejectionReasonOrNotes?: string,
      options?: EscalationResolveOptions,
    ): Promise<void> => {
      if (!canResolveEscalation) {
        notify.show('lab.escalation.permissionDenied');
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
            notify.show('lab.escalation.resolve.success');
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
      onResetForm,
    ],
  );

  return { canResolveEscalation, resolving, resolveAsync };
}
