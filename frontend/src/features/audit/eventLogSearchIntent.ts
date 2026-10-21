/**
 * Client-side mirror of backend classify_search_term — keep in sync with audit/search.py.
 */
import { parseRecordFilterDisplayId } from './parseRecordDisplayId';
import { formatDisplayId } from '@/utils/id';

export type EventLogSearchIntentMode =
  | 'empty'
  | 'record_order'
  | 'record_test'
  | 'record_sample'
  | 'record_patient'
  | 'numeric'
  | 'text';

export type EventLogSearchDimension = 'patientName' | 'actorName' | 'username';

export interface EventLogSearchParsedIds {
  orderId?: number;
  testId?: number;
  sampleId?: number;
  patientId?: number;
}

export interface EventLogSearchIntent {
  mode: EventLogSearchIntentMode;
  textTerm: string | null;
  dimensions: EventLogSearchDimension[];
  parsedIds: EventLogSearchParsedIds | null;
  displayToken: string | null;
}

const TEXT_DIMENSIONS: EventLogSearchDimension[] = ['patientName', 'actorName', 'username'];

export function classifyEventLogSearchIntent(term: string): EventLogSearchIntent {
  const trimmed = term.trim();
  if (!trimmed) {
    return {
      mode: 'empty',
      textTerm: null,
      dimensions: [],
      parsedIds: null,
      displayToken: null,
    };
  }

  const compact = trimmed.replace(/[\s-]/g, '');
  const upper = compact.toUpperCase();
  if (/^\d+$/.test(compact) && !/^(TST|ORD|SAM|PAT)/.test(upper)) {
    const numeric = Number.parseInt(compact, 10);
    return {
      mode: 'numeric',
      textTerm: compact,
      dimensions: [],
      parsedIds: { orderId: numeric, patientId: numeric, testId: numeric },
      displayToken: null,
    };
  }

  const parsed = parseRecordFilterDisplayId(trimmed);
  if (parsed.kind === 'test') {
    return {
      mode: 'record_test',
      textTerm: null,
      dimensions: [],
      parsedIds: { testId: parsed.testId },
      displayToken: formatDisplayId('orderTest', parsed.testId),
    };
  }
  if (parsed.kind === 'order') {
    return {
      mode: 'record_order',
      textTerm: null,
      dimensions: [],
      parsedIds: { orderId: parsed.orderId },
      displayToken: formatDisplayId('order', parsed.orderId),
    };
  }
  if (parsed.kind === 'sample') {
    return {
      mode: 'record_sample',
      textTerm: null,
      dimensions: [],
      parsedIds: { sampleId: parsed.sampleId },
      displayToken: formatDisplayId('sample', parsed.sampleId),
    };
  }
  if (parsed.kind === 'patient') {
    return {
      mode: 'record_patient',
      textTerm: null,
      dimensions: [],
      parsedIds: { patientId: parsed.patientId },
      displayToken: formatDisplayId('patient', parsed.patientId),
    };
  }

  return {
    mode: 'text',
    textTerm: trimmed,
    dimensions: TEXT_DIMENSIONS,
    parsedIds: null,
    displayToken: null,
  };
}
