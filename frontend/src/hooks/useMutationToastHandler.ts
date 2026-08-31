/**
 * Shared mutation toast + logger handler for async lab/workflow actions.
 */

import { useCallback } from 'react';
import { toast } from '@/app/AppToastBar';
import { logger } from '@/utils/logger';

export interface MutationToastMessages {
  successTitle: string;
  successSubtitle?: string;
  errorTitle: string;
  errorSubtitle?: string;
}

export function useMutationToastHandler(logLabel: string) {
  const runWithToast = useCallback(
    async <T>(mutation: () => Promise<T>, messages: MutationToastMessages): Promise<T> => {
      try {
        const result = await mutation();
        toast.success({
          title: messages.successTitle,
          subtitle: messages.successSubtitle,
        });
        return result;
      } catch (error) {
        logger.error(logLabel, error instanceof Error ? error : undefined);
        toast.error({
          title: messages.errorTitle,
          subtitle: messages.errorSubtitle,
        });
        throw error;
      }
    },
    [logLabel]
  );

  return { runWithToast };
}
