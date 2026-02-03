/**
 * useLabHistory - Aggregates lab operation events from multiple sources
 * into a unified timeline for the command center.
 */

import { useMemo } from 'react';
import { useOrdersList, useSamplesList } from '@/hooks/queries';
import type { Sample, OrderTest } from '@/types';

export type LabHistoryEventType =
  | 'sample_created'
  | 'sample_collected'
  | 'sample_rejected'
  | 'result_entered'
  | 'result_validated'
  | 'result_rejected'
  | 'escalation_requested';

export interface LabHistoryEvent {
  id: string; // Unique identifier for the event
  type: LabHistoryEventType;
  timestamp: string;
  actor: string; // User who performed the action
  description: string; // Human-readable description
  orderId?: number;
  sampleId?: number;
  testCode?: string;
}

/**
 * Extract events from a sample
 */
function extractSampleEvents(sample: Sample): LabHistoryEvent[] {
  const events: LabHistoryEvent[] = [];

  // Sample created event
  events.push({
    id: `sample-created-${sample.sampleId}`,
    type: 'sample_created',
    timestamp: sample.createdAt,
    actor: sample.createdBy,
    description: 'New sampling arrived',
    orderId: sample.orderId,
    sampleId: sample.sampleId,
  });

  // Sample collected event
  if (sample.status === 'collected' || sample.status === 'rejected') {
    events.push({
      id: `sample-collected-${sample.sampleId}`,
      type: 'sample_collected',
      timestamp: sample.collectedAt,
      actor: sample.collectedBy,
      description: 'Sampling performed',
      orderId: sample.orderId,
      sampleId: sample.sampleId,
    });
  }

  // Sample rejected event
  if (sample.status === 'rejected') {
    events.push({
      id: `sample-rejected-${sample.sampleId}`,
      type: 'sample_rejected',
      timestamp: sample.rejectedAt,
      actor: sample.rejectedBy,
      description: 'Sample rejected',
      orderId: sample.orderId,
      sampleId: sample.sampleId,
    });
  }

  // Additional rejection history events
  if (sample.rejectionHistory && sample.rejectionHistory.length > 0) {
    sample.rejectionHistory.forEach((rejection, index) => {
      events.push({
        id: `sample-rejection-history-${sample.sampleId}-${index}`,
        type: 'sample_rejected',
        timestamp: rejection.rejectedAt,
        actor: rejection.rejectedBy,
        description: 'Sample rejected',
        orderId: sample.orderId,
        sampleId: sample.sampleId,
      });
    });
  }

  return events;
}

/**
 * Extract events from an order test
 */
function extractTestEvents(test: OrderTest, orderId: number): LabHistoryEvent[] {
  const events: LabHistoryEvent[] = [];

  // Result entered event
  if (test.resultEnteredAt && test.enteredBy) {
    events.push({
      id: `result-entered-${test.id || `${orderId}-${test.testCode}`}`,
      type: 'result_entered',
      timestamp: test.resultEnteredAt,
      actor: test.enteredBy,
      description: 'Result entered',
      orderId,
      sampleId: test.sampleId,
      testCode: test.testCode,
    });
  }

  // Result validated event
  if (test.resultValidatedAt && test.validatedBy) {
    events.push({
      id: `result-validated-${test.id || `${orderId}-${test.testCode}`}`,
      type: 'result_validated',
      timestamp: test.resultValidatedAt,
      actor: test.validatedBy,
      description: 'Result validated',
      orderId,
      sampleId: test.sampleId,
      testCode: test.testCode,
    });
  }

  // Result rejection events from history
  if (test.resultRejectionHistory && test.resultRejectionHistory.length > 0) {
    test.resultRejectionHistory.forEach((rejection, index) => {
      const eventType: LabHistoryEventType =
        rejection.rejectionType === 'escalate' ? 'escalation_requested' : 'result_rejected';

      events.push({
        id: `result-rejection-${test.id || `${orderId}-${test.testCode}`}-${index}`,
        type: eventType,
        timestamp: rejection.rejectedAt,
        actor: rejection.rejectedBy,
        description:
          rejection.rejectionType === 'escalate'
            ? 'Escalation requested'
            : 'Result rejected',
        orderId,
        sampleId: test.sampleId,
        testCode: test.testCode,
      });
    });
  }

  return events;
}

/**
 * Hook to get lab history events
 */
export function useLabHistory() {
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { samples, isLoading: samplesLoading } = useSamplesList();

  const events = useMemo(() => {
    const allEvents: LabHistoryEvent[] = [];

    // Extract events from samples
    for (const sample of samples) {
      allEvents.push(...extractSampleEvents(sample));
    }

    // Extract events from order tests
    for (const order of orders) {
      for (const test of order.tests) {
        allEvents.push(...extractTestEvents(test, order.orderId));
      }
    }

    // Sort by timestamp (most recent first)
    allEvents.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return allEvents;
  }, [orders, samples]);

  return {
    events,
    isLoading: ordersLoading || samplesLoading,
  };
}
