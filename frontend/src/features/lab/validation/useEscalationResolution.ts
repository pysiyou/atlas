import { useCallback, useMemo } from 'react';
import { toast } from '@/app/AppToastBar';
import { useAuthStore } from '@/app/store';
import { useResolveEscalation } from '@/features/lab/validation/results.api';
import type { EscalationResolutionAction } from '@/types/lab-operations';

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
      final_reject: 'Sample rejected; new sample requested.',
    }),
    []
  );

  const resolveAsync = useCallback(
    (action: EscalationResolutionAction, rejectionReasonOrNotes?: string): Promise<void> => {
      if (!canResolveEscalation || resolving) return Promise.resolve();

      const variables = {
        orderId,
        testCode,
        action,
        validationNotes: action === 'force_validate' ? rejectionReasonOrNotes?.trim() : undefined,
        rejectionReason:
          action === 'authorize_retest'
            ? rejectionReasonOrNotes?.trim() || 'Authorized re-test (escalation resolution)'
            : action === 'final_reject'
              ? (rejectionReasonOrNotes ?? '').trim()
              : undefined,
      };

      return resolveEscalation.mutateAsync(variables, {
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
      }).then(() => {});
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
