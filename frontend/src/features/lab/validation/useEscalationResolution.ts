import { useCallback, useMemo } from 'react';
import { toast } from '@/app/AppToastBar';
import { useAuthStore } from '@/app/store';
import { useResolveEscalation } from '@/features/lab/validation/results.api';
import type { EscalationResolutionAction } from '@/types/lab-operations';
import type { EscalationResolveOptions } from './EscalationResolutionActions';

interface UseEscalationResolutionOptions {
  orderId: number;
  testCode: string;
  onResolved: () => void | Promise<void>;
  onClose: () => void;
  onResetForm: () => void;
}

export function useEscalationResolution({
  orderId,
  testCode,
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
      final_reject: 'Test cancelled (final reject).',
    }),
    []
  );

  const resolveAsync = useCallback(
    (
      action: EscalationResolutionAction,
      rejectionReasonOrNotes?: string,
      options?: EscalationResolveOptions
    ): Promise<void> => {
      if (!canResolveEscalation || resolving) return Promise.resolve();

      const variables = {
        orderId,
        testCode,
        action,
        validationNotes: action === 'force_validate' ? rejectionReasonOrNotes?.trim() : undefined,
        rejectionReason:
          action === 'authorize_retest'
            ? rejectionReasonOrNotes?.trim() || 'Authorized re-test (escalation resolution)'
            : action === 'authorize_recollect' || action === 'final_reject'
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
            toast.error({
              title: msg,
              subtitle: 'The escalation could not be resolved. Check the details and try again.',
            });
          },
        })
        .catch(() => {
          // Error already surfaced via onError toast.
        });
    },
    [
      orderId,
      testCode,
      onResolved,
      onClose,
      resolving,
      resolveEscalation,
      canResolveEscalation,
      messages,
      onResetForm,
    ]
  );

  return { canResolveEscalation, resolving, resolveAsync };
}
