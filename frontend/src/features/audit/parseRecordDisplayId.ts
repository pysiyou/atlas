/**
 * Parse ORD/TST/SAM/PAT display tokens into numeric record ids for audit filters.
 */
import { ID_PREFIXES, parseDisplayId } from '@/utils/id';

export function parseOrderDisplayId(input: string): number | null {
  return parseDisplayId('order', input);
}

export function parseOrderTestDisplayId(input: string): number | null {
  return parseDisplayId('orderTest', input);
}

export function parseSampleDisplayId(input: string): number | null {
  return parseDisplayId('sample', input);
}

export function parsePatientDisplayId(input: string): number | null {
  return parseDisplayId('patient', input);
}

export type ParsedRecordIdFilter =
  | { kind: 'empty' }
  | { kind: 'order'; orderId: number }
  | { kind: 'test'; testId: number }
  | { kind: 'sample'; sampleId: number }
  | { kind: 'patient'; patientId: number }
  | { kind: 'invalid' };

/**
 * Parse a combined record display token (TST… / ORD… / SAM… / PAT…).
 * Bare digits are treated as an order id.
 */
export function parseRecordFilterDisplayId(input: string): ParsedRecordIdFilter {
  const trimmed = input.trim();
  if (!trimmed) {
    return { kind: 'empty' };
  }
  const upper = trimmed.toUpperCase();
  if (upper.startsWith(ID_PREFIXES.orderTest)) {
    const testId = parseOrderTestDisplayId(input);
    return testId != null ? { kind: 'test', testId } : { kind: 'invalid' };
  }
  if (upper.startsWith(ID_PREFIXES.order)) {
    const orderId = parseOrderDisplayId(input);
    return orderId != null ? { kind: 'order', orderId } : { kind: 'invalid' };
  }
  if (upper.startsWith(ID_PREFIXES.sample)) {
    const sampleId = parseSampleDisplayId(input);
    return sampleId != null ? { kind: 'sample', sampleId } : { kind: 'invalid' };
  }
  if (upper.startsWith(ID_PREFIXES.patient)) {
    const patientId = parsePatientDisplayId(input);
    return patientId != null ? { kind: 'patient', patientId } : { kind: 'invalid' };
  }
  const orderId = parseOrderDisplayId(input);
  return orderId != null ? { kind: 'order', orderId } : { kind: 'invalid' };
}
