import type { BlockedReason } from '@/features/lab/utils/deriveWorkItemState';
import type { LabTabId } from '@/features/lab/constants/labTabs';
import type { PriorityLevel } from '@/types';

export type LabBoardHealth = 'healthy' | 'attention' | 'critical';

export interface QueueAgeStats {
  oldestHours: number | null;
  averageHours: number | null;
  warningCount: number;
  criticalCount: number;
}

export interface QueueAgeAccumulator {
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
  workItemCount: number;
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

export type QueueStage = keyof LabTechBoardData['queueAge'];
