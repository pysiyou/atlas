import { deriveWorkItemState } from '@/features/lab/utils/deriveWorkItemState';
import { getQueueAgeInfo } from '@/features/lab/utils/queueAge';
import { LAB_CONFIG } from '@/features/lab/constants';
import type { PriorityLevel, SampleStatus } from '@/types';
import {
  accumulateAge,
  bumpAgeBucket,
  bumpPriority,
  emptyAgeBuckets,
  emptyPriorityMix,
  emptyQueueAge,
  finalizeQueueAge,
} from './deriveQueueStats';
import type {
  AgeBuckets,
  AttentionItem,
  BlockerSummary,
  PriorityMix,
  QueueAgeStats,
} from './boardTypes';

const STAGE_LABELS: Record<AttentionItem['stage'], string> = {
  collection: 'Collection',
  entry: 'Entry',
  validation: 'Review',
};

export interface CollectionDisplayInput {
  sample: { sampleId: number; status: string; isRecollection: boolean };
  order: {
    orderId: number;
    orderDate: string;
    patientId: number;
    priority: PriorityLevel;
    paymentStatus: string;
  };
}

export interface TestQueueInput {
  id?: number;
  orderId: number;
  orderDate: string;
  collectedAt?: string | null;
  resultEnteredAt?: string | null;
  priority?: string;
  patientName?: string;
  isRetest: boolean;
  sampleStatus?: SampleStatus;
  sampleIsRecollection?: boolean;
  reasonCode?: string | null;
}

export interface RecollectionRequestInput {
  id: number;
  orderId: number;
  createdAt: string;
  patientName?: string;
  affectedOrderTestIds?: number[];
  orderTestId?: number | null;
}

export interface BoardPipelineInput {
  collectionDisplays: CollectionDisplayInput[];
  entryTests: TestQueueInput[];
  validationTests: TestQueueInput[];
  escalatedTests: TestQueueInput[];
  recollectionRequests: RecollectionRequestInput[];
  getPatientName: (patientId: number) => string;
  getOrder: (orderId: number) => { priority?: PriorityLevel } | undefined;
}

export interface BoardPipelineResult {
  queueAge: Record<'collection' | 'entry' | 'validation', QueueAgeStats>;
  blockers: BlockerSummary;
  ageBuckets: AgeBuckets;
  priorityMix: PriorityMix;
  attentionCandidates: AttentionItem[];
}

function isElevatedPriority(priority: PriorityLevel | string | undefined): boolean {
  return priority === 'urgent' || priority === 'high';
}

function shouldSurfaceAttention(
  blockedReason: AttentionItem['blockedReason'],
  waitingHours: number,
  priority: PriorityLevel | string | undefined,
): boolean {
  return (
    Boolean(blockedReason) ||
    waitingHours >= LAB_CONFIG.QUEUE_AGE_WARNING_HOURS ||
    isElevatedPriority(priority)
  );
}

/** Single pass over pipeline queues — derives queue stats, blockers, and attention candidates. */
export function deriveBoardPipeline(input: BoardPipelineInput): BoardPipelineResult {
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

  for (const display of input.collectionDisplays) {
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
        sampleStatus: display.sample.status as SampleStatus,
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
        patientName: input.getPatientName(display.order.patientId),
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

  for (const test of input.entryTests) {
    const since = test.collectedAt ?? test.orderDate;
    accumulateAge(queueAge.entry, since);
    bumpPriority(priorityMix, test.priority);

    const ageInfo = getQueueAgeInfo(since);
    if (ageInfo) bumpAgeBucket(ageBuckets, ageInfo.hours);

    const workItem = deriveWorkItemState(
      { status: 'sample-collected', isRetest: test.isRetest },
      {
        sampleStatus: test.sampleStatus,
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

  for (const test of input.validationTests) {
    const since = test.resultEnteredAt ?? test.collectedAt ?? test.orderDate;
    accumulateAge(queueAge.validation, since);
    bumpPriority(priorityMix, test.priority);

    const ageInfo = getQueueAgeInfo(since);
    if (ageInfo) bumpAgeBucket(ageBuckets, ageInfo.hours);

    const workItem = deriveWorkItemState(
      { status: 'resulted', isRetest: test.isRetest },
      {
        sampleStatus: test.sampleStatus,
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

  for (const test of input.escalatedTests) {
    const since = test.resultEnteredAt ?? test.orderDate;
    if (!since) continue;

    const ageInfo = getQueueAgeInfo(since);
    const waitingHours = ageInfo?.hours ?? 0;
    const workItem = deriveWorkItemState(
      { status: 'escalated', isRetest: test.isRetest },
      {
        sampleStatus: test.sampleStatus,
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

  for (const request of input.recollectionRequests) {
    const since = request.createdAt;
    const ageInfo = getQueueAgeInfo(since);
    const waitingHours = ageInfo?.hours ?? 0;
    const order = input.getOrder(request.orderId);

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

  return {
    queueAge: {
      collection: finalizeQueueAge(queueAge.collection),
      entry: finalizeQueueAge(queueAge.entry),
      validation: finalizeQueueAge(queueAge.validation),
    },
    blockers,
    ageBuckets,
    priorityMix,
    attentionCandidates,
  };
}
