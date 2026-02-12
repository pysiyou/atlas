/**
 * useWorkflowStateCounts - Counts of lab operations by stage (sampling, entry, validation).
 * Percentages of total in-flight operations for LabStateBubbles.
 */

import { useMemo } from 'react';
import { useOrdersList } from '@/hooks/queries';
import { isActiveTest } from '@/utils/orderUtils';

export interface WorkflowStateCounts {
  sampling: number;
  entry: number;
  validation: number;
  total: number;
  samplingPct: number;
  entryPct: number;
  validationPct: number;
  // Intersection percentages (operations belonging to multiple stages)
  samplingEntryPct: number;
  entryValidationPct: number;
  samplingValidationPct: number;
  isLoading: boolean;
}

export function useWorkflowStateCounts(): WorkflowStateCounts {
  const { orders, isLoading } = useOrdersList();

  const counts = useMemo(() => {
    let sampling = 0;
    let entry = 0;
    let validation = 0;

    (orders ?? []).forEach((order) => {
      (order.tests ?? []).forEach((test) => {
        if (!isActiveTest(test)) return;
        if (test.status === 'pending') {
          sampling += 1;
          return;
        }
        if (test.status === 'sample-collected' || test.status === 'in-progress') {
          entry += 1;
          return;
        }
        if (test.status === 'resulted') {
          validation += 1;
        }
      });
    });

    const total = sampling + entry + validation;
    const samplingPct = total === 0 ? 0 : Math.round((sampling / total) * 10000) / 100;
    const entryPct = total === 0 ? 0 : Math.round((entry / total) * 10000) / 100;
    const validationPct = total === 0 ? 0 : Math.round((validation / total) * 10000) / 100;

    return {
      sampling,
      entry,
      validation,
      total,
      samplingPct,
      entryPct,
      validationPct,
      // Intersection percentages - TODO: calculate when data model supports multi-stage operations
      samplingEntryPct: 0,
      entryValidationPct: 0,
      samplingValidationPct: 0,
      isLoading,
    };
  }, [orders, isLoading]);

  return counts;
}
