/**
 * Normalized dashboard order-row model and worklist adapters.
 * Collection samples expand to one row per ordered test.
 */
import type {
  CollectionWorklistItem,
  DashboardBlockedWorklistItem,
  EntryWorklistItem,
  ValidationWorklistItem,
} from '../../api/worklists';
import { getLabQueueUrl } from '../../constants/labConstants';
import type { LabPipelineStage } from '../commandCenterModel';
import type { PriorityLevel, SampleStatus, Test, TestStatus } from '@/types';
import { displayId } from '@/utils';

export interface LabDashboardOrderRow {
  id: string;
  stage: LabPipelineStage;
  testName: string;
  patientName: string;
  patientId: number;
  doctorName: string | null;
  department: string | null;
  priority: PriorityLevel;
  status: SampleStatus | TestStatus;
  date: string;
  orderId: number;
  href: string;
  blockedLabel?: string | null;
}

export type TestLookup = (testCode: string) => Test | undefined;

function queueHref(stage: LabPipelineStage, orderId: number): string {
  return getLabQueueUrl(stage, { search: displayId.order(orderId) });
}

export function fromCollectionItem(
  item: CollectionWorklistItem,
  getTest: TestLookup,
): LabDashboardOrderRow[] {
  const codes = item.testCodes.length > 0 ? item.testCodes : [''];
  return codes.map((code, index) => {
    const test = code ? getTest(code) : undefined;
    return {
      id: `collection-${item.sampleId}-${code || index}`,
      stage: 'collection',
      testName: test?.name || code || item.testName || 'Sample collection',
      patientName: item.patientName,
      patientId: item.patientId,
      doctorName: item.referringPhysician ?? null,
      department: test?.category ?? item.testCategory ?? null,
      priority: item.priority,
      status: item.status,
      date: item.orderDate,
      orderId: item.orderId,
      href: queueHref('collection', item.orderId),
    };
  });
}

export function fromEntryItem(item: EntryWorklistItem): LabDashboardOrderRow {
  return {
    id: `entry-${item.orderTestId}`,
    stage: 'entry',
    testName: item.testName,
    patientName: item.patientName,
    patientId: item.patientId,
    doctorName: item.referringPhysician ?? null,
    department: item.testCategory ?? null,
    priority: item.priority,
    status: item.status,
    date: item.collectedAt || item.orderDate,
    orderId: item.orderId,
    href: queueHref('entry', item.orderId),
  };
}

export function fromValidationItem(item: ValidationWorklistItem): LabDashboardOrderRow {
  return {
    id: `validation-${item.orderTestId}`,
    stage: 'validation',
    testName: item.testName,
    patientName: item.patientName,
    patientId: item.patientId,
    doctorName: item.referringPhysician ?? null,
    department: item.testCategory ?? null,
    priority: item.priority,
    status: item.status,
    date: item.resultEnteredAt || item.orderDate,
    orderId: item.orderId,
    href: queueHref('validation', item.orderId),
  };
}

export function fromDashboardBlockedItem(item: DashboardBlockedWorklistItem): LabDashboardOrderRow {
  return {
    id: `blocked-${item.orderTestId}`,
    stage: item.stage,
    testName: item.testName,
    patientName: item.patientName,
    patientId: item.patientId,
    doctorName: item.referringPhysician ?? null,
    department: item.testCategory ?? null,
    priority: item.priority,
    status: item.status,
    date: item.orderDate,
    orderId: item.orderId,
    href: queueHref(item.stage, item.orderId),
    blockedLabel: item.blockedLabel,
  };
}

export function mergeDashboardOrders(
  collection: CollectionWorklistItem[],
  entry: EntryWorklistItem[],
  validation: ValidationWorklistItem[],
  blocked: DashboardBlockedWorklistItem[],
  getTest: TestLookup,
): LabDashboardOrderRow[] {
  return [
    ...collection.flatMap(item => fromCollectionItem(item, getTest)),
    ...entry.map(fromEntryItem),
    ...validation.map(fromValidationItem),
    ...blocked.map(fromDashboardBlockedItem),
  ].sort((a, b) => {
    const byDate = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (byDate !== 0) return byDate;
    return a.testName.localeCompare(b.testName);
  });
}
