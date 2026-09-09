import { useCallback, useMemo } from 'react';
import { toast } from '@/app/AppToastBar';
import { useAuthStore } from '@/app/store';
import { useResolveEscalation } from '@/features/lab/api/results.api';
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
      if (!canResolveEscalation || resolving) return Promise.resolve();

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
            toast.success({
              title: messages[action] ?? 'Operation completed.',
              subtitle: 'The escalation has been resolved and the test status updated.',
            });
            onResetForm();
          },
          onError: err => {
            const apiError = err as { message?: string };
            const msg =
              apiError && typeof apiError === 'object' && typeof apiError.message === 'string'
                ? apiError.message
                : 'Failed to resolve escalation.';
            toast.error({ title: msg, subtitle: 'Check the details and try again.' });
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
