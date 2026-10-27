/**
 * Cross-feature presentation — view models, formatters, descriptors (no React).
 * UI: features/shared/entityPresentation.tsx. Hooks: hooks/presentationHooks.ts.
 */

import type { ReactNode } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import type { DescriptionListItemConfig } from '@/components/display/DescriptionList';
import {
  CONTAINER_COLOR_OPTIONS,
  CONTAINER_CONFIG,
  type ContainerType,
  type Gender,
  type Order,
  type OrderTest,
  type RejectedSample,
  type Sample,
} from '@/types';
import { INACTIVE_REPORTABLE_TEST_STATUSES } from '@/features/orders/constants/reportableTestStatus';
import {
  formatBirthdayWithAge,
  formatAddress,
  formatEmergencyContactDisplay,
  formatPatientDetailDate,
  formatPatientSexAgeLine,
} from '@/features/patients';
import { companyConfig } from '@/config';
import { displayId, formatCurrency, formatDateTime } from '@/utils';
import { formatTruncatedListPreview } from '@/utils/array';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';


export {
  formatBirthdayWithAge,
  formatAddress,
  formatEmergencyContactDisplay,
  formatPatientDetailDate,
  formatPatientSexAgeLine,
};

// ---- types.ts ----
export type FieldKind = 'text' | 'timestamp' | 'badge';

export interface PresentationContext {
  resolveUserDisplay?: (userId: string) => string | undefined;
}

export interface FieldDescriptor {
  id: string;
  label: string;
  kind?: FieldKind;
  value?: string | null;
  timestamp?: string;
  user?: string;
  hidden?: boolean | ((ctx: PresentationContext) => boolean);
  gridSpan?: 'full';
  renderValue?: (ctx: PresentationContext) => ReactNode;
}


// ---- buildDescriptionItems.ts ----
function isHidden(descriptor: FieldDescriptor, ctx: PresentationContext): boolean {
  if (typeof descriptor.hidden === 'function') {
    return descriptor.hidden(ctx);
  }
  return descriptor.hidden === true;
}

export function buildDescriptionItems(
  descriptors: FieldDescriptor[],
  ctx: PresentationContext = {}
): DescriptionListItemConfig[] {
  const items: DescriptionListItemConfig[] = [];

  for (const descriptor of descriptors) {
    if (isHidden(descriptor, ctx)) {
      continue;
    }

    if (descriptor.renderValue) {
      items.push({
        label: descriptor.label,
        value: descriptor.renderValue(ctx),
      });
      continue;
    }

    items.push({
      label: descriptor.label,
      value: descriptor.value ?? undefined,
      timestamp: descriptor.timestamp,
      user: descriptor.user,
    });
  }

  return items;
}


// ---- datetime.ts ----
export { formatDateTime };

export function formatDateTimeOrDash(date: string | Date | null | undefined): string {
  if (!date) {
    return '—';
  }
  return formatDateTime(date);
}


// ---- order.ts ----
export function formatTestCountLabel(count: number): string {
  return `${count} test${count !== 1 ? 's' : ''}`;
}

export function formatReportValidationStatus(
  validatedCount: number,
  activeCount: number
): string {
  return `${validatedCount}/${activeCount}`;
}

export function formatPatientOrdersCountLabel(orderCount: number): string {
  return orderCount === 1 ? '1 order' : `${orderCount} orders`;
}


// ---- sample.ts ----
export function formatVolumeMl(volumeInMl: number): string {
  if (volumeInMl < 1) {
    return `${(volumeInMl * 1000).toFixed(0)}µL`;
  }
  return `${volumeInMl.toFixed(1)}mL`;
}

export function formatSampleStatusLabel(status: string): string {
  return formatStatusBadgeLabel(status);
}

export function formatSampleTypeLabel(sampleType: string): string {
  return formatStatusBadgeLabel(sampleType);
}


// ---- status.ts ----
export { formatStatusBadgeLabel, resolveStatusBadgeColor } from '@/utils/statusBadge';


// ---- currency.ts ----
export function formatTableAmount(amount: number): string {
  return formatCurrency(amount);
}

export { formatCurrency };


// ---- catalog.ts ----
export function formatSynonymsPreview(
  synonyms: string[] | undefined,
  max = 2
): string | null {
  if (!synonyms?.length) {
    return null;
  }
  const preview = synonyms.slice(0, max).join(', ');
  if (synonyms.length > max) {
    return `${preview} +${synonyms.length - max} more`;
  }
  return preview;
}


// ---- sampleCollection.ts ----
export interface SampleCollectionViewModel {
  isPending: boolean;
  isRejected: boolean;
  isCollected: boolean;
  rejectedSample: RejectedSample | null;
  hasCollection: boolean;
  collectedAt?: string;
  collectedBy?: string;
  collectedVolume?: number;
  remainingVolume?: number;
  collectionNotes?: string;
  containerColor?: string;
  colorName?: string;
  containerType?: ContainerType | string;
  effectiveContainerType: ContainerType;
}

function readCollectionTimestamps(sample: Sample, hasCollection: boolean) {
  if (!hasCollection) {
    return {};
  }
  return {
    collectedAt: 'collectedAt' in sample ? sample.collectedAt : undefined,
    collectedBy: 'collectedBy' in sample ? sample.collectedBy : undefined,
    collectedVolume: 'collectedVolume' in sample ? sample.collectedVolume : undefined,
    remainingVolume: 'remainingVolume' in sample ? sample.remainingVolume : undefined,
    collectionNotes: 'collectionNotes' in sample ? sample.collectionNotes : undefined,
  };
}

function readContainerFields(sample: Sample, isCollected: boolean, isRejected: boolean) {
  const hasContainerInfo = (isCollected || isRejected) && 'actualContainerColor' in sample;
  const containerColor = hasContainerInfo ? sample.actualContainerColor : undefined;
  const colorName = containerColor
    ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.label ?? 'N/A'
    : undefined;
  const containerType =
    hasContainerInfo && 'actualContainerType' in sample
      ? sample.actualContainerType
      : sample.requiredContainerTypes?.[0];
  const effectiveContainerType: ContainerType =
    (containerType as ContainerType) ||
    (sample.sampleType === 'urine' || sample.sampleType === 'stool' ? 'cup' : 'tube');
  return { containerColor, colorName, containerType, effectiveContainerType };
}

export function getSampleCollectionViewModel(sample: Sample): SampleCollectionViewModel {
  const isPending = sample.status === 'pending';
  const isRejected = sample.status === 'rejected';
  const isCollected = sample.status === 'collected';
  const rejectedSample = isRejected ? (sample as RejectedSample) : null;
  const hasCollection = (isCollected || isRejected) && 'collectedAt' in sample;
  const timestamps = readCollectionTimestamps(sample, hasCollection);
  const container = readContainerFields(sample, isCollected, isRejected);

  return {
    isPending,
    isRejected,
    isCollected,
    rejectedSample,
    hasCollection,
    ...timestamps,
    ...container,
  };
}

export function resolveCollectionPatientName(
  pendingPatientFullName: string | undefined,
  order: Order | undefined
): string {
  return pendingPatientFullName || order?.patientName || 'Unknown';
}

export function deriveCollectionModalFields(
  sample: Sample,
  order: Order | undefined,
  pendingPatientFullName: string | undefined
) {
  const vm = getSampleCollectionViewModel(sample);
  const patientName = resolveCollectionPatientName(pendingPatientFullName, order);

  return {
    isPending: vm.isPending,
    isRejected: vm.isRejected,
    isCollected: vm.isCollected,
    rejectedSample: vm.rejectedSample,
    containerColor: vm.containerColor,
    colorName: vm.colorName ?? 'N/A',
    effectiveContainerType: vm.effectiveContainerType,
    patientName,
    collectedAt: vm.collectedAt,
    collectedBy: vm.collectedBy,
    collectedVolume: vm.collectedVolume,
    remainingVolume: vm.remainingVolume,
    collectionNotes: vm.collectionNotes,
  };
}


// ---- orderTests.ts ----
export type OrderTestsBlockLayout = 'countFirst' | 'namesFirst';

export interface OrderTestsPresentationInput {
  activeTests: Pick<OrderTest, 'testCode' | 'testName'>[];
  fallbackCount?: number;
  testCodes?: string[];
  /** When aligned with testCodes, used before catalog lookup. */
  testNames?: string[];
  getTestName?: (testCode: string) => string;
  layout?: OrderTestsBlockLayout;
  showAllNames?: boolean;
}

export interface OrderTestsPresentationResult {
  activeCount: number;
  nameLabels: string[];
  codeLabels: string[];
  labels: string[];
  namesFirstPreview: string;
  countFirstSecondary: string;
  namesPreview: string;
  codesPreview: string;
  fullNames: string;
  fullCodes: string;
}

export interface ReportableOrderTestsInput {
  testNames: string[];
  testCodes: string[];
  activeTestCount: number;
  order?: Order | null;
}

export function getActiveOrderTests(order: Order): OrderTest[] {
  return (order.tests ?? [])
    .filter(test => !INACTIVE_REPORTABLE_TEST_STATUSES.has(test.status))
    .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
}

function resolveActiveCount(input: OrderTestsPresentationInput): number {
  const { activeTests, fallbackCount, testCodes } = input;
  return (
    fallbackCount ??
    (activeTests.length > 0 ? activeTests.length : (testCodes?.length ?? 0))
  );
}

function resolveNameLabels(input: OrderTestsPresentationInput): string[] {
  const { activeTests, testCodes, testNames, getTestName } = input;
  if (activeTests.length > 0) {
    return activeTests.map(t => t.testName || t.testCode);
  }
  const codes = testCodes ?? [];
  if (testNames && testNames.length === codes.length && testNames.length > 0) {
    return testNames;
  }
  return codes.map(code => getTestName?.(code) || code);
}

function resolveCodeLabels(input: OrderTestsPresentationInput): string[] {
  const { activeTests, testCodes } = input;
  if (activeTests.length > 0) {
    return activeTests.map(t => t.testCode);
  }
  return testCodes ?? [];
}

function buildNamesFirstPreview(
  labels: string[],
  activeCount: number,
  showAllNames: boolean
): string {
  if (labels.length === 0) {
    return activeCount > 0 ? formatTestCountLabel(activeCount) : '';
  }
  if (showAllNames) {
    return labels.join(', ');
  }
  return formatTruncatedListPreview(labels);
}

export function resolveOrderTestsPresentation(
  input: OrderTestsPresentationInput
): OrderTestsPresentationResult {
  const activeCount = resolveActiveCount(input);
  const nameLabels = resolveNameLabels(input);
  const codeLabels = resolveCodeLabels(input);
  const labels = nameLabels;
  const showAllNames = input.showAllNames ?? false;

  const namesFirstPreview = buildNamesFirstPreview(labels, activeCount, showAllNames);
  const countFirstSecondary = showAllNames
    ? labels.join(', ')
    : formatTruncatedListPreview(labels);

  const fullNames = nameLabels.join(', ');
  const fullCodes = codeLabels.join(', ');
  const namesPreview =
    nameLabels.length > 0
      ? formatTruncatedListPreview(nameLabels)
      : formatTestCountLabel(activeCount);
  const codesPreview = formatTruncatedListPreview(codeLabels);

  return {
    activeCount,
    nameLabels,
    codeLabels,
    labels,
    namesFirstPreview,
    countFirstSecondary,
    namesPreview,
    codesPreview,
    fullNames,
    fullCodes,
  };
}

export function resolveReportableOrderTests(
  order: ReportableOrderTestsInput
): OrderTestsPresentationResult {
  const nameLabels =
    order.testNames.length > 0
      ? order.testNames
      : order.order
        ? getActiveOrderTests(order.order).map(test => test.testName)
        : [];
  const codeLabels =
    order.testCodes.length > 0
      ? order.testCodes
      : order.order
        ? getActiveOrderTests(order.order).map(test => test.testCode)
        : [];

  return resolveOrderTestsPresentation({
    activeTests: nameLabels.map((name, i) => ({
      testName: name,
      testCode: codeLabels[i] ?? name,
    })),
    fallbackCount: order.activeTestCount,
    testCodes: codeLabels.length > 0 ? codeLabels : undefined,
  });
}

export function getReportOrderTestLabels(order: ReportableOrderTestsInput): {
  nameLabels: string[];
  codeLabels: string[];
} {
  const result = resolveReportableOrderTests(order);
  return { nameLabels: result.nameLabels, codeLabels: result.codeLabels };
}

export function formatReportOrderTestsPreview(order: ReportableOrderTestsInput): {
  names: string;
  codes: string;
  fullNames: string;
  fullCodes: string;
} {
  const result = resolveReportableOrderTests(order);
  const names =
    result.nameLabels.length > 0
      ? result.namesPreview
      : `${order.activeTestCount} test(s)`;
  return {
    names,
    codes: result.codesPreview,
    fullNames: result.fullNames,
    fullCodes: result.fullCodes,
  };
}


// ---- orderContext.ts ----
export interface PatientListSnippet {
  patientId?: number | string;
  patientName: string;
  gender?: Gender | string | null;
  dateOfBirth?: string | null;
}

export interface OrderListHeader {
  orderId: number | string;
  orderDate?: string;
  referentDoctor?: string | null;
}

export interface OrderContextPresentation {
  patientName: string;
  demographicsLine: string | null;
  orderId?: number | string;
  orderDate?: string;
}

export function buildOrderContextPresentation(
  patient: PatientListSnippet,
  order?: OrderListHeader
): OrderContextPresentation {
  return {
    patientName: patient.patientName,
    demographicsLine: formatPatientSexAgeLine(patient.gender, patient.dateOfBirth),
    orderId: order?.orderId,
    orderDate: order?.orderDate,
  };
}


// ---- reportHeader.ts ----
export interface ReportHeaderSource {
  patientId: number;
  patientName: string;
  patientDob?: string;
  patientAge?: number;
  patientGender?: string;
  patientEmail?: string;
  order: {
    orderId: number;
    orderDate?: string;
    createdAt?: string;
    referentDoctorName?: string | null;
    scheduledCollectionTime?: string;
    patientEmail?: string;
  };
  timestamps?: {
    registeredAt?: string;
    collectedAt?: string;
    acceptedAt?: string;
    reportedAt?: string;
  };
  sampleCollection?: {
    collectedAt?: string;
  };
}

export interface ReportHeaderViewModel {
  branchName: string;
  orderDisplay: string;
  samplingDisplay: string;
  printingDateDisplay: string;
  referentDoctor: string;
  patientDisplay: string;
  birthdayDisplay: string;
  sexDisplay: string;
  emailDisplay: string;
  registeredAt?: string;
  collectedAt?: string;
}

function parseReportInstant(dateString?: string | null): Date | null {
  if (!dateString) return null;
  try {
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function formatReportDocumentDate(dateString?: string | null): string {
  const parsed = parseReportInstant(dateString);
  return parsed ? format(parsed, 'dd/MM/yyyy') : '';
}

function formatReportClock(dateString?: string | null): string {
  const parsed = parseReportInstant(dateString);
  return parsed ? format(parsed, 'HH:mm') : '';
}

export function formatReportOnAt(dateString?: string | null): string {
  const datePart = formatReportDocumentDate(dateString);
  const timePart = formatReportClock(dateString);
  if (datePart && timePart) return `on: ${datePart} at: ${timePart}`;
  if (datePart) return `on: ${datePart}`;
  if (timePart) return `at: ${timePart}`;
  return '';
}

export function formatReportAtDateTime(dateString?: string | null): string {
  const datePart = formatReportDocumentDate(dateString);
  const timePart = formatReportClock(dateString);
  if (datePart && timePart) return `${datePart} at: ${timePart}`;
  return datePart || timePart;
}

export function formatReportGenderLetter(gender?: string): string {
  if (!gender) return '';
  const normalized = gender.toLowerCase();
  if (normalized === 'male' || normalized === 'm') return 'M';
  if (normalized === 'female' || normalized === 'f') return 'F';
  return gender.charAt(0).toUpperCase();
}

function resolveBranchName(): string {
  const city = companyConfig.getContact().address.city?.trim();
  if (city) return city;
  return companyConfig.getName();
}

function resolveRegisteredAt(source: ReportHeaderSource): string | undefined {
  return (
    source.timestamps?.registeredAt ??
    source.order.orderDate ??
    source.order.createdAt
  );
}

function resolveCollectedAt(source: ReportHeaderSource): string | undefined {
  return (
    source.timestamps?.collectedAt ??
    source.sampleCollection?.collectedAt ??
    source.timestamps?.acceptedAt ??
    source.order.scheduledCollectionTime
  );
}

function formatBirthdayDisplay(source: ReportHeaderSource): string {
  const dobPart = source.patientDob ? formatReportDocumentDate(source.patientDob) : '';
  const age = source.patientAge;
  if (dobPart && age !== undefined) {
    const ageLabel = age === 1 ? '1 year old' : `${age} years old`;
    return `${dobPart} (${ageLabel})`;
  }
  if (dobPart) return dobPart;
  if (age !== undefined) {
    const ageLabel = age === 1 ? '1 year old' : `${age} years old`;
    return `(${ageLabel})`;
  }
  return '';
}

export function buildReportHeaderViewModel(
  source: ReportHeaderSource,
  printingDate: Date = new Date()
): ReportHeaderViewModel {
  const registeredAt = resolveRegisteredAt(source);
  const collectedAt = resolveCollectedAt(source);
  const orderId = displayId.order(source.order.orderId);
  const when = formatReportOnAt(registeredAt);
  const orderDisplay = when ? `${orderId} ${when}` : orderId;

  const patientCode = displayId.patient(source.patientId);
  const patientDisplay = `${source.patientName}(Internal: ${patientCode})`;

  const email =
    source.patientEmail?.trim() || source.order.patientEmail?.trim() || '';

  return {
    branchName: resolveBranchName(),
    orderDisplay,
    samplingDisplay: formatReportAtDateTime(collectedAt),
    printingDateDisplay: formatReportAtDateTime(printingDate.toISOString()),
    referentDoctor: source.order.referentDoctorName?.trim() ?? '',
    patientDisplay,
    birthdayDisplay: formatBirthdayDisplay(source),
    sexDisplay: formatReportGenderLetter(source.patientGender),
    emailDisplay: email,
    registeredAt,
    collectedAt,
  };
}


// ---- sampleCollectionFields.ts ----
function appendPendingContainerDescriptors(
  descriptors: FieldDescriptor[],
  sample: Sample
): void {
  if (sample.status !== 'pending' || !sample.requiredContainerTypes?.length) {
    return;
  }
  descriptors.push({
    id: 'containers',
    label: 'Containers',
    value: sample.requiredContainerTypes
      .map(t => CONTAINER_CONFIG[t]?.label ?? t)
      .join(', '),
  });
}

function appendCollectionDescriptors(
  descriptors: FieldDescriptor[],
  sample: Sample
): void {
  const vm = getSampleCollectionViewModel(sample);
  if (!vm.hasCollection) {
    return;
  }

  descriptors.push(
    {
      id: 'collected',
      label: 'Collected',
      timestamp: vm.collectedAt,
      user: vm.collectedBy,
    },
    {
      id: 'volCollected',
      label: 'Vol. collected',
      value:
        vm.collectedVolume !== undefined ? formatVolumeMl(vm.collectedVolume) : undefined,
    },
    {
      id: 'remaining',
      label: 'Remaining',
      value:
        vm.remainingVolume !== undefined ? formatVolumeMl(vm.remainingVolume) : undefined,
    }
  );

  if (vm.containerType) {
    const containerLabel =
      CONTAINER_CONFIG[vm.containerType as ContainerType]?.label ?? vm.containerType;
    const containerText =
      vm.containerColor && vm.colorName
        ? `${containerLabel} · ${vm.colorName} top`
        : containerLabel;
    descriptors.push({ id: 'container', label: 'Container', value: containerText });
  }
}

function appendRecollectionDescriptors(
  descriptors: FieldDescriptor[],
  sample: Sample
): void {
  if (!sample.isRecollection) {
    return;
  }
  descriptors.push(
    {
      id: 'recollect',
      label: 'Recollect #',
      value: String(sample.recollectionAttempt ?? '—'),
    },
    {
      id: 'original',
      label: 'Original',
      value:
        sample.originalSampleId != null
          ? displayId.sample(sample.originalSampleId)
          : undefined,
    },
    { id: 'reason', label: 'Reason', value: sample.recollectionReason }
  );
}

export function getSampleCollectionFieldDescriptors(sample: Sample): FieldDescriptor[] {
  const descriptors: FieldDescriptor[] = [
    { id: 'status', label: 'Status', value: formatSampleStatusLabel(sample.status) },
    { id: 'type', label: 'Type', value: formatSampleTypeLabel(sample.sampleType) },
    {
      id: 'priority',
      label: 'Priority',
      value: sample.priority ? formatStatusBadgeLabel(sample.priority) : undefined,
    },
    { id: 'required', label: 'Required', value: formatVolumeMl(sample.requiredVolume) },
  ];

  appendPendingContainerDescriptors(descriptors, sample);
  appendCollectionDescriptors(descriptors, sample);
  appendRecollectionDescriptors(descriptors, sample);

  return descriptors;
}

export function buildSampleCollectionDescriptionItems(sample: Sample) {
  return buildDescriptionItems(getSampleCollectionFieldDescriptors(sample));
}


export * from '@/features/shared/entityPresentation';
export * from '@/hooks/presentationHooks';
