/**
 * Report PDF/header view-models (no React).
 */

import { format, isValid, parseISO } from 'date-fns';
import { companyConfig } from '@/config';
import { displayId } from '@/utils/id';

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
