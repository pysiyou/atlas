/**
 * Parse ORD/TST/SAM/PAT display tokens into numeric entity ids for audit filters.
 */
import { ID_PREFIXES } from '@/utils/id';

function stripPrefix(raw: string, prefix: string): string {
  const upper = raw.trim().toUpperCase();
  if (upper.startsWith(prefix)) {
    return upper.slice(prefix.length);
  }
  return upper;
}

function parsePaddedDigits(digits: string): number | null {
  const trimmed = digits.trim();
  if (!trimmed) return null;
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

export function parseOrderDisplayId(input: string): number | null {
  const body = stripPrefix(input, ID_PREFIXES.order);
  return parsePaddedDigits(body);
}

export function parseOrderTestDisplayId(input: string): number | null {
  const body = stripPrefix(input, ID_PREFIXES.orderTest);
  return parsePaddedDigits(body);
}

export function parseSampleDisplayId(input: string): number | null {
  const body = stripPrefix(input, ID_PREFIXES.sample);
  return parsePaddedDigits(body);
}

export function parsePatientDisplayId(input: string): number | null {
  const body = stripPrefix(input, ID_PREFIXES.patient);
  return parsePaddedDigits(body);
}

export type ParsedEntityIdFilter =
  | { kind: 'empty' }
  | { kind: 'order'; orderId: number }
  | { kind: 'test'; testId: number }
  | { kind: 'sample'; sampleId: number }
  | { kind: 'patient'; patientId: number }
  | { kind: 'invalid' };

/**
 * Parse a combined entity display token (TST… / ORD… / SAM… / PAT…).
 * Bare digits are treated as an order id.
 */
export function parseEntityFilterDisplayId(input: string): ParsedEntityIdFilter {
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

/** @deprecated Use parseEntityFilterDisplayId. */
export function parseOrderOrTestDisplayId(input: string): ParsedEntityIdFilter {
  return parseEntityFilterDisplayId(input);
}
