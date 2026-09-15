import type { BlockedReason } from '@/features/lab/utils/deriveWorkItemState';
import type { PriorityLevel } from '@/types';
import type { AttentionType } from './attentionCategories';

export type LabBoardHealth = 'healthy' | 'attention' | 'critical';

export type QueueStage = 'collection' | 'entry' | 'validation';

export interface QueueAgeStats {
  oldestHours: number | null;
  averageHours: number | null;
  warningCount: number;
  criticalCount: number;
}

export interface AttentionItem {
  id: string;
  stage: QueueStage;
  stageLabel: string;
  orderId: number;
  patientName: string;
  priority: PriorityLevel;
  waitingHours: number;
  blockedReason: BlockedReason | null;
  blockedLabel: string | null;
  queueTab: QueueStage;
  since: string;
  workItemCount: number;
  orderTestIds: number[];
  attentionType: AttentionType;
}

export interface BlockerSummary {
  paymentUnpaid: number;
  retestPending: number;
  recollectionWaiting: number;
  total: number;
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
  counts: { collection: number; entry: number; validation: number; supervisor: number };
  queueAge: Record<QueueStage, QueueAgeStats>;
  blockers: BlockerSummary;
  attentionItems: AttentionItem[];
  attentionTotal: number;
  ageBuckets: AgeBuckets;
  priorityMix: PriorityMix;
  health: LabBoardHealth;
  healthMessage: string;
  suggestedTab: QueueStage | null;
  totalActive: number;
  computedAt?: string | null;
}
