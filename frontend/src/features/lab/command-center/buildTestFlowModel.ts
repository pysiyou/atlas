/**
 * View model builder for the live test flow panel.
 */

import { TEST_STATUS_CONFIG, type TestStatus } from '@/types/enums/generated/test';
import type { OperationsOverviewResponse } from '../api/commandCenter.api';

const MAIN_FLOW: TestStatus[] = ['pending', 'sample-collected', 'resulted', 'validated'];

const TERMINAL_FLOW: TestStatus[] = ['escalated', 'cancelled', 'removed'];

export interface PipelineItem {
  status: TestStatus;
  label: string;
  count: number;
  percentage: number;
}

export type FlowHealth = 'healthy' | 'attention' | 'critical';

export interface TestFlowViewModel {
  totalTests: number;
  activeTests: number;
  validatedCount: number;
  cancelledCount: number;
  removedCount: number;
  inProgressCount: number;
  completionRate: number;
  attentionCount: number;
  health: FlowHealth;
  healthLabel: string;
  mainFlow: PipelineItem[];
  terminalFlow: PipelineItem[];
  escalationResolutionRate: number;
  escalations: OperationsOverviewResponse['escalations'];
  qualityIssues: number;
  recollection: OperationsOverviewResponse['recollectionRequests'];
  escalatedInFlow: number;
  recollectionTotal: number;
}

function toPipelineItem(status: TestStatus, count: number, total: number): PipelineItem {
  return {
    status,
    label: TEST_STATUS_CONFIG[status].label,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  };
}

export function buildTestFlowModel(data: OperationsOverviewResponse): TestFlowViewModel {
  const { testFlow, escalations, qualityIssues, recollectionRequests } = data;

  const allStatuses = [...MAIN_FLOW, ...TERMINAL_FLOW];
  const totalTests = allStatuses.reduce((sum, status) => sum + (testFlow[status] ?? 0), 0);

  const mainFlow = MAIN_FLOW.map(status =>
    toPipelineItem(status, testFlow[status] ?? 0, totalTests),
  );
  const terminalFlow = TERMINAL_FLOW.map(status =>
    toPipelineItem(status, testFlow[status] ?? 0, totalTests),
  );

  const validatedCount = testFlow.validated ?? 0;
  const cancelledCount = testFlow.cancelled ?? 0;
  const removedCount = testFlow.removed ?? 0;
  const activeTests = totalTests - cancelledCount - removedCount;
  const completionRate = activeTests > 0 ? Math.round((validatedCount / activeTests) * 100) : 0;
  const inProgressCount = mainFlow
    .slice(0, 3)
    .reduce((sum, item) => sum + item.count, 0);

  const attentionCount =
    escalations.open + (testFlow.escalated ?? 0) + recollectionRequests.pending;

  const escalationTotal = escalations.open + escalations.resolved;
  const escalationResolutionRate =
    escalationTotal > 0 ? Math.round((escalations.resolved / escalationTotal) * 100) : 100;

  let health: FlowHealth = 'healthy';
  let healthLabel = 'All clear';
  if (escalations.open > 0 || (testFlow.escalated ?? 0) > 0) {
    health = 'critical';
    healthLabel = 'Critical';
  } else if (attentionCount > 0 || qualityIssues > 5) {
    health = 'attention';
    healthLabel = 'Needs review';
  }

  const recollectionTotal =
    recollectionRequests.pending + recollectionRequests.approved + recollectionRequests.denied;

  return {
    totalTests,
    activeTests,
    validatedCount,
    cancelledCount,
    removedCount,
    inProgressCount,
    completionRate,
    attentionCount,
    health,
    healthLabel,
    mainFlow,
    terminalFlow,
    escalationResolutionRate,
    escalations,
    qualityIssues,
    recollection: recollectionRequests,
    escalatedInFlow: testFlow.escalated ?? 0,
    recollectionTotal,
  };
}
