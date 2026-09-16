import type { OrderTestBlockReason } from '../utils/deriveOrderTestQueueState';
import type { PriorityLevel } from '@/types';
import type { AttentionType } from './attentionCategories';

export type LabBoardHealth = 'healthy' | 'attention' | 'critical';

export type LabPipelineStage = 'collection' | 'entry' | 'validation';

export interface QueueAgeStats {
  oldestHours: number | null;
  averageHours: number | null;
  warningCount: number;
  criticalCount: number;
}

export interface LabAttentionQueueItem {
  id: string;
  stage: LabPipelineStage;
  stageLabel: string;
  orderId: number;
  patientName: string;
  priority: PriorityLevel;
  waitingHours: number;
  blockedReason: OrderTestBlockReason | null;
  blockedLabel: string | null;
  queueTab: LabPipelineStage;
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

export interface LabCommandCenterSnapshot {
  counts: { collection: number; entry: number; validation: number; supervisor: number };
  queueAge: Record<LabPipelineStage, QueueAgeStats>;
  blockers: BlockerSummary;
  attentionItems: LabAttentionQueueItem[];
  attentionTotal: number;
  ageBuckets: AgeBuckets;
  priorityMix: PriorityMix;
  health: LabBoardHealth;
  healthMessage: string;
  suggestedTab: LabPipelineStage | null;
  totalActive: number;
  computedAt?: string | null;
}
