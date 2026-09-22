/**
 * Normalized dashboard order-row model for today's work table.
 */
import type { DashboardWorklistItem } from '../../api/worklists';
import { getLabQueueUrl } from '../../constants/labConstants';
import type { LabPipelineStage } from '../commandCenterModel';
import type { PriorityLevel, TestStatus } from '@/types';
import { displayId } from '@/utils';

export interface LabDashboardOrderRow {
  id: string;
  stage: LabPipelineStage;
  testCode: string;
  testName: string;
  patientName: string;
  patientId: number;
  doctorName: string | null;
  department: string | null;
  sampleType: string;
  priority: PriorityLevel;
  status: TestStatus;
  date: string;
  orderId: number;
  href: string;
  blockedLabel?: string | null;
}

function queueHref(stage: LabPipelineStage, orderId: number): string {
  return getLabQueueUrl(stage, { search: displayId.order(orderId) });
}

export function mapDashboardWorkToday(item: DashboardWorklistItem): LabDashboardOrderRow {
  return {
    id: `today-${item.orderTestId}`,
    stage: item.stage,
    testCode: item.testCode,
    testName: item.testName,
    patientName: item.patientName,
    patientId: item.patientId,
    doctorName: item.referringPhysician ?? null,
    department: item.testCategory ?? null,
    sampleType: item.sampleType,
    priority: item.priority,
    status: item.status,
    date: item.activityAt,
    orderId: item.orderId,
    href: queueHref(item.stage, item.orderId),
    blockedLabel: item.blockedLabel,
  };
}
