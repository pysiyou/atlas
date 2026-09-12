/**
 * Aggregates live lab state for the lab tech command center board.
 */

import { useMemo } from 'react';
import { isToday, parseISO, isValid } from 'date-fns';
import { useOrdersList } from '@/features/orders';
import { useSamplesList } from '@/features/lab/api/samples.api';
import { useTestCatalog } from '@/features/catalog';
import { usePatientNameLookup } from '@/features/patients';
import { useOrderLookup } from '@/features/orders';
import { useCollectionSampleDisplays } from '@/features/lab/collection/useCollectionSampleDisplays';
import { usePendingEscalation } from '@/features/lab/api/results.api';
import { usePendingRecollectionRequests } from '@/features/lab/api/recollection-requests.api';
import { useLabPipelineCounts, useLabTestsFromOrders } from '@/features/lab/hooks';
import { deriveWorkItemState, type BlockedReason } from '@/features/lab/utils/deriveWorkItemState';
import {
  attentionTypeSortKey,
  getAttentionType,
  isPriorityAttentionType,
  isSupervisorAttentionType,
} from '../attentionCategories';
import { getQueueAgeInfo } from '@/features/lab/utils/queueAge';
import { LAB_CONFIG } from '@/features/lab/constants';
import type { LabTabId } from '@/features/lab/constants/labTabs';
import type { PriorityLevel, SampleStatus } from '@/types';

export type LabBoardHealth = 'healthy' | 'attention' | 'critical';

export interface QueueAgeStats {
  oldestHours: number | null;
  averageHours: number | null;
  warningCount: number;
  criticalCount: number;
}

interface QueueAgeAccumulator {
  oldestHours: number | null;
  sumHours: number;
  itemCount: number;
  warningCount: number;
  criticalCount: number;
}

export interface AttentionItem {
  id: string;
  stage: 'collection' | 'entry' | 'validation';
  stageLabel: string;
  orderId: number;
  patientName: string;
  priority: PriorityLevel;
  waitingHours: number;
  blockedReason: BlockedReason | null;
  blockedLabel: string | null;
  queueTab: LabTabId;
  since: string;
  /** Tests or specimens rolled up into this row (same order + attention type). */
  workItemCount: number;
  /** Order test IDs when the attention row is test-centric (entry/validation). */
  orderTestIds: number[];
}

export interface BlockerSummary {
  paymentUnpaid: number;
  retestPending: number;
  recollectionWaiting: number;
  total: number;
}

export interface TodayThroughput {
  validated: number;
  collected: number;
  resultsEntered: number;
  ordersCompleted: number;
  rejected: number;
  ordersCreated: number;
}

export interface AgeBuckets {
  fresh: number;
  onTrack: number;
  warning: number;
  critical: number;
}

export interface PriorityMix {
  urgent: number;
  high: number;
  medium: number;
  low: number;
}

export interface LabTechBoardData {
  counts: { collection: number; entry: number; validation: number };
  queueAge: Record<'collection' | 'entry' | 'validation', QueueAgeStats>;
  blockers: BlockerSummary;
  attentionItems: AttentionItem[];
  attentionTotal: number;
  todayThroughput: TodayThroughput;
  ageBuckets: AgeBuckets;
  priorityMix: PriorityMix;
  health: LabBoardHealth;
  healthMessage: string;
  suggestedTab: LabTabId | null;
  totalActive: number;
}

const STAGE_LABELS: Record<AttentionItem['stage'], string> = {
  collection: 'Collection',
  entry: 'Entry',
  validation: 'Review',
};

const PRIORITY_WEIGHT: Record<PriorityLevel, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function isSameLocalDay(iso: string | undefined | null): boolean {
  if (!iso) return false;
  const date = parseISO(iso);
  return isValid(date) && isToday(date);
}

function accumulateAge(stats: QueueAgeAccumulator, since: string | undefined | null): void {
  const info = getQueueAgeInfo(since);
  if (!info) return;

  stats.itemCount += 1;
  stats.sumHours += info.hours;

  if (stats.oldestHours === null || info.hours > stats.oldestHours) {
    stats.oldestHours = info.hours;
  }
  if (info.variant === 'warning') stats.warningCount += 1;
  if (info.variant === 'danger') stats.criticalCount += 1;
}

function emptyQueueAge(): QueueAgeAccumulator {
  return { oldestHours: null, sumHours: 0, itemCount: 0, warningCount: 0, criticalCount: 0 };
}

function finalizeQueueAge(stats: QueueAgeAccumulator): QueueAgeStats {
  return {
    oldestHours: stats.oldestHours,
    averageHours:
      stats.itemCount > 0 ? Math.round((stats.sumHours / stats.itemCount) * 10) / 10 : null,
    warningCount: stats.warningCount,
    criticalCount: stats.criticalCount,
  };
}

function emptyAgeBuckets(): AgeBuckets {
  return { fresh: 0, onTrack: 0, warning: 0, critical: 0 };
}

function emptyPriorityMix(): PriorityMix {
  return { urgent: 0, high: 0, medium: 0, low: 0 };
}

function bumpAgeBucket(buckets: AgeBuckets, hours: number): void {
  if (hours < 1) buckets.fresh += 1;
  else if (hours < LAB_CONFIG.QUEUE_AGE_WARNING_HOURS) buckets.onTrack += 1;
  else if (hours < LAB_CONFIG.QUEUE_AGE_CRITICAL_HOURS) buckets.warning += 1;
  else buckets.critical += 1;
}

function bumpPriority(mix: PriorityMix, priority: PriorityLevel | string | undefined): void {
  if (priority === 'urgent') mix.urgent += 1;
  else if (priority === 'high') mix.high += 1;
  else if (priority === 'low') mix.low += 1;
  else mix.medium += 1;
}

function isElevatedPriority(priority: PriorityLevel | string | undefined): boolean {
  return priority === 'urgent' || priority === 'high';
}

function shouldSurfaceAttention(
  blockedReason: BlockedReason | null,
  waitingHours: number,
  priority: PriorityLevel | string | undefined,
): boolean {
  return (
    Boolean(blockedReason) ||
    waitingHours >= LAB_CONFIG.QUEUE_AGE_WARNING_HOURS ||
    isElevatedPriority(priority)
  );
}

function attentionSortScore(item: AttentionItem): number {
  const typeScore = 1000 - attentionTypeSortKey(getAttentionType(item));
  const ageScore = item.waitingHours * 10;
  const priorityScore = PRIORITY_WEIGHT[item.priority] * 100;
  return typeScore + ageScore + priorityScore;
}

function consolidateAttentionItems(candidates: AttentionItem[]): AttentionItem[] {
  const map = new Map<string, AttentionItem>();

  for (const item of candidates) {
    const type = getAttentionType(item);
    const key = `${type}-${item.orderId}-${item.queueTab}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, { ...item, id: key, workItemCount: 1 });
      continue;
    }

    map.set(key, {
      ...existing,
      waitingHours: Math.max(existing.waitingHours, item.waitingHours),
      priority:
        PRIORITY_WEIGHT[item.priority] > PRIORITY_WEIGHT[existing.priority]
          ? item.priority
          : existing.priority,
      since: item.waitingHours > existing.waitingHours ? item.since : existing.since,
      workItemCount: existing.workItemCount + 1,
      orderTestIds: [...new Set([...existing.orderTestIds, ...item.orderTestIds])],
    });
  }

  return Array.from(map.values());
}

function deriveHealth(
  queueAge: LabTechBoardData['queueAge'],
  blockers: BlockerSummary,
  attentionItems: AttentionItem[],
): Pick<LabTechBoardData, 'health' | 'healthMessage' | 'suggestedTab'> {
  const criticalCount =
    queueAge.collection.criticalCount +
    queueAge.entry.criticalCount +
    queueAge.validation.criticalCount;

  const warningCount =
    queueAge.collection.warningCount +
    queueAge.entry.warningCount +
    queueAge.validation.warningCount;

  if (criticalCount > 0) {
    const stage =
      (['collection', 'entry', 'validation'] as const).find(
        key => queueAge[key].criticalCount > 0,
      ) ?? 'validation';
    return {
      health: 'critical',
      healthMessage: `${criticalCount} accession${criticalCount === 1 ? '' : 's'} >${LAB_CONFIG.QUEUE_AGE_CRITICAL_HOURS}h TAT`,
      suggestedTab: stage,
    };
  }

  const supervisorCount = attentionItems.filter(item =>
    isSupervisorAttentionType(getAttentionType(item)),
  ).length;
  const priorityCount = attentionItems.filter(item =>
    isPriorityAttentionType(getAttentionType(item)),
  ).length;

  if (warningCount > 0 || blockers.total > 0 || supervisorCount > 0 || priorityCount > 0) {
    const parts: string[] = [];
    if (warningCount > 0) {
      parts.push(`${warningCount} >${LAB_CONFIG.QUEUE_AGE_WARNING_HOURS}h TAT`);
    }
    if (supervisorCount > 0) {
      parts.push(`${supervisorCount} path review`);
    }
    if (priorityCount > 0) {
      parts.push(`${priorityCount} STAT/high`);
    }
    if (blockers.paymentUnpaid > 0) {
      parts.push(`${blockers.paymentUnpaid} unpaid hold`);
    }
    if (blockers.retestPending > 0) {
      parts.push(`${blockers.retestPending} repeat pending`);
    }
    if (blockers.recollectionWaiting > 0) {
      parts.push(`${blockers.recollectionWaiting} redraw pending`);
    }

    const topItem = attentionItems[0];
    return {
      health: 'attention',
      healthMessage: parts.join(' · '),
      suggestedTab: topItem?.queueTab ?? null,
    };
  }

  return {
    health: 'healthy',
    healthMessage: 'Queues within TAT',
    suggestedTab: null,
  };
}

export function useLabTechBoard(): LabTechBoardData {
  const { orders = [] } = useOrdersList();
  const { samples = [] } = useSamplesList();
  const { tests: testCatalog = [] } = useTestCatalog();
  const { getPatient, getPatientName } = usePatientNameLookup();
  const { getOrder } = useOrderLookup();
  const { counts } = useLabPipelineCounts();
  const { escalatedTests = [] } = usePendingEscalation();
  const { requests: recollectionRequests = [] } = usePendingRecollectionRequests();

  const { displays: collectionDisplays } = useCollectionSampleDisplays({
    samples,
    tests: testCatalog,
    getOrder,
    getPatient,
    getPatientName,
  });

  const entryTests = useLabTestsFromOrders({
    orders,
    testCatalog,
    statusFilter: ['sample-collected'],
    includePatient: false,
  });

  const validationTests = useLabTestsFromOrders({
    orders,
    testCatalog,
    statusFilter: ['resulted'],
    onlyUnvalidated: true,
  });

  return useMemo(() => {
    const queueAge = {
      collection: emptyQueueAge(),
      entry: emptyQueueAge(),
      validation: emptyQueueAge(),
    };

    const blockers: BlockerSummary = {
      paymentUnpaid: 0,
      retestPending: 0,
      recollectionWaiting: 0,
      total: 0,
    };

    const ageBuckets = emptyAgeBuckets();
    const priorityMix = emptyPriorityMix();
    const attentionCandidates: AttentionItem[] = [];

    for (const display of collectionDisplays) {
      if (display.sample?.status !== 'pending') continue;

      const since = display.order.orderDate;
      accumulateAge(queueAge.collection, since);
      bumpPriority(priorityMix, display.order.priority);

      const ageInfo = getQueueAgeInfo(since);
      if (ageInfo) bumpAgeBucket(ageBuckets, ageInfo.hours);

      const workItem = deriveWorkItemState(
        { status: 'pending', isRetest: false },
        {
          paymentStatus: display.order.paymentStatus,
          sampleStatus: display.sample.status,
          sampleIsRecollection: display.sample.isRecollection,
        },
      );

      if (workItem.blockedReason === 'payment_unpaid') blockers.paymentUnpaid += 1;
      if (workItem.blockedReason === 'specimen_recollection') blockers.recollectionWaiting += 1;

      if (!ageInfo) continue;

      if (shouldSurfaceAttention(workItem.blockedReason, ageInfo.hours, display.order.priority)) {
        attentionCandidates.push({
          id: `collection-${display.sample.sampleId}`,
          stage: 'collection',
          stageLabel: STAGE_LABELS.collection,
          orderId: display.order.orderId,
          patientName: getPatientName(display.order.patientId),
          priority: display.order.priority,
          waitingHours: ageInfo.hours,
          blockedReason: workItem.blockedReason,
          blockedLabel: workItem.blockedReason ? workItem.label : null,
          queueTab: 'collection',
          since,
          workItemCount: 1,
          orderTestIds: [],
        });
      }
    }

    for (const test of entryTests) {
      const since = test.collectedAt ?? test.orderDate;
      accumulateAge(queueAge.entry, since);
      bumpPriority(priorityMix, test.priority);

      const ageInfo = getQueueAgeInfo(since);
      if (ageInfo) bumpAgeBucket(ageBuckets, ageInfo.hours);

      const workItem = deriveWorkItemState(
        { status: 'sample-collected', isRetest: test.isRetest },
        {
          sampleStatus: test.sampleStatus as SampleStatus | undefined,
          sampleIsRecollection: test.sampleIsRecollection,
          escalationReasonCode: test.reasonCode,
        },
      );

      if (workItem.blockedReason === 'retest_pending') blockers.retestPending += 1;

      if (!ageInfo || !since) continue;

      if (shouldSurfaceAttention(workItem.blockedReason, ageInfo.hours, test.priority)) {
        attentionCandidates.push({
          id: `entry-${test.id}`,
          stage: 'entry',
          stageLabel: STAGE_LABELS.entry,
          orderId: test.orderId,
          patientName: test.patientName ?? 'Unknown patient',
          priority: test.priority as PriorityLevel,
          waitingHours: ageInfo.hours,
          blockedReason: workItem.blockedReason,
          blockedLabel: workItem.blockedReason ? workItem.label : null,
          queueTab: 'entry',
          since,
          workItemCount: 1,
          orderTestIds: test.id != null ? [test.id] : [],
        });
      }
    }

    for (const test of validationTests) {
      const since = test.resultEnteredAt ?? test.collectedAt ?? test.orderDate;
      accumulateAge(queueAge.validation, since);
      bumpPriority(priorityMix, test.priority);

      const ageInfo = getQueueAgeInfo(since);
      if (ageInfo) bumpAgeBucket(ageBuckets, ageInfo.hours);

      const workItem = deriveWorkItemState(
        { status: 'resulted', isRetest: test.isRetest },
        {
          sampleStatus: test.sampleStatus as SampleStatus | undefined,
          escalationReasonCode: test.reasonCode,
        },
      );

      if (!ageInfo || !since) continue;

      if (shouldSurfaceAttention(workItem.blockedReason, ageInfo.hours, test.priority)) {
        attentionCandidates.push({
          id: `validation-${test.id}`,
          stage: 'validation',
          stageLabel: STAGE_LABELS.validation,
          orderId: test.orderId,
          patientName: test.patientName ?? 'Unknown patient',
          priority: test.priority as PriorityLevel,
          waitingHours: ageInfo.hours,
          blockedReason: workItem.blockedReason,
          blockedLabel: workItem.blockedReason ? workItem.label : null,
          queueTab: 'validation',
          since,
          workItemCount: 1,
          orderTestIds: test.id != null ? [test.id] : [],
        });
      }
    }

    for (const test of escalatedTests) {
      const since = test.resultEnteredAt ?? test.orderDate;
      if (!since) continue;

      const ageInfo = getQueueAgeInfo(since);
      const waitingHours = ageInfo?.hours ?? 0;
      const workItem = deriveWorkItemState(
        { status: 'escalated', isRetest: test.isRetest },
        {
          sampleStatus: test.sampleStatus as SampleStatus | undefined,
          escalationReasonCode: test.reasonCode,
        },
      );

      attentionCandidates.push({
        id: `escalation-${test.id}`,
        stage: 'validation',
        stageLabel: STAGE_LABELS.validation,
        orderId: test.orderId,
        patientName: test.patientName ?? 'Unknown patient',
        priority: test.priority as PriorityLevel,
        waitingHours,
        blockedReason: workItem.blockedReason ?? 'supervisor_review',
        blockedLabel: workItem.label,
        queueTab: 'validation',
        since,
        workItemCount: 1,
        orderTestIds: test.id != null ? [test.id] : [],
      });
    }

    for (const request of recollectionRequests) {
      const since = request.createdAt;
      const ageInfo = getQueueAgeInfo(since);
      const waitingHours = ageInfo?.hours ?? 0;
      const order = getOrder(request.orderId);

      attentionCandidates.push({
        id: `recollection-req-${request.id}`,
        stage: 'validation',
        stageLabel: STAGE_LABELS.validation,
        orderId: request.orderId,
        patientName: request.patientName ?? 'Unknown patient',
        priority: (order?.priority ?? 'medium') as PriorityLevel,
        waitingHours,
        blockedReason: 'recollection_approval',
        blockedLabel: 'Redraw pending path approval',
        queueTab: 'validation',
        since,
        workItemCount: request.affectedOrderTestIds?.length ?? 1,
        orderTestIds:
          request.affectedOrderTestIds?.length > 0
            ? request.affectedOrderTestIds
            : request.orderTestId != null
              ? [request.orderTestId]
              : [],
      });
    }

    blockers.total = blockers.paymentUnpaid + blockers.retestPending + blockers.recollectionWaiting;

    const attentionTotal = attentionCandidates.length;
    const attentionItems = consolidateAttentionItems(attentionCandidates).sort(
      (a, b) => attentionSortScore(b) - attentionSortScore(a),
    );

    let validatedToday = 0;
    let resultsEnteredToday = 0;
    let ordersCompletedToday = 0;
    let ordersCreatedToday = 0;

    for (const order of orders) {
      if (isSameLocalDay(order.createdAt) || isSameLocalDay(order.orderDate)) {
        ordersCreatedToday += 1;
      }
      if (order.overallStatus === 'completed' && isSameLocalDay(order.updatedAt)) {
        ordersCompletedToday += 1;
      }
      for (const test of order.tests ?? []) {
        if (isSameLocalDay(test.resultEnteredAt)) resultsEnteredToday += 1;
        if (test.status === 'validated' && isSameLocalDay(test.resultValidatedAt)) {
          validatedToday += 1;
        }
      }
    }

    const collectedToday = samples.filter(
      sample => sample.status === 'collected' && isSameLocalDay(sample.collectedAt),
    ).length;

    const rejectedToday = samples.filter(
      sample => sample.status === 'rejected' && isSameLocalDay(sample.rejectedAt),
    ).length;

    const todayThroughput: TodayThroughput = {
      validated: validatedToday,
      collected: collectedToday,
      resultsEntered: resultsEnteredToday,
      ordersCompleted: ordersCompletedToday,
      rejected: rejectedToday,
      ordersCreated: ordersCreatedToday,
    };

    const totalActive = counts.collection + counts.entry + counts.validation;
    const finalizedQueueAge = {
      collection: finalizeQueueAge(queueAge.collection),
      entry: finalizeQueueAge(queueAge.entry),
      validation: finalizeQueueAge(queueAge.validation),
    };
    const { health, healthMessage, suggestedTab } = deriveHealth(
      finalizedQueueAge,
      blockers,
      attentionItems,
    );

    return {
      counts,
      queueAge: finalizedQueueAge,
      blockers,
      attentionItems,
      attentionTotal,
      todayThroughput,
      ageBuckets,
      priorityMix,
      health,
      healthMessage,
      suggestedTab,
      totalActive,
    };
  }, [
    collectionDisplays,
    entryTests,
    validationTests,
    counts,
    orders,
    samples,
    getPatientName,
    getOrder,
    escalatedTests,
    recollectionRequests,
  ]);
}
