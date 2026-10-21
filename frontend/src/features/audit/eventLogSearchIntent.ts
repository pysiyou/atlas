/**
 * Event log search intent classification and match-group builders (pure).
 */
import type { IconName } from '@/components/primitives';
import { ICONS } from '@/config/icons';
import { formatDisplayId } from '@/utils/id';
import type { AuditSearchPreviewResponse } from './api';
import { parseRecordFilterDisplayId } from './eventLogPanelState';
import { EVENT_LOG_COPY } from './types';

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

export type EventLogSearchMatchCategoryId = 'recordIds' | 'patients' | 'users';

export interface EventLogSearchMatchItem {
  key: string;
  primary: string;
  secondary?: string;
  applyValue: string;
  icon?: IconName;
  avatarName?: string;
}

export interface EventLogSearchMatchGroup {
  id: EventLogSearchMatchCategoryId;
  label: string;
  items: EventLogSearchMatchItem[];
}

function buildRecordIdItems(intent: EventLogSearchIntent): EventLogSearchMatchItem[] {
  if (intent.mode === 'record_order' && intent.displayToken) {
    return [
      {
        key: 'order',
        icon: ICONS.dataFields.document,
        primary: `${EVENT_LOG_COPY.searchIntentOrder} ${intent.displayToken}`,
        secondary: intent.displayToken,
        applyValue: intent.displayToken,
      },
    ];
  }
  if (intent.mode === 'record_test' && intent.displayToken) {
    return [
      {
        key: 'test',
        icon: ICONS.dataFields.testId,
        primary: `${EVENT_LOG_COPY.searchIntentTest} ${intent.displayToken}`,
        secondary: intent.displayToken,
        applyValue: intent.displayToken,
      },
    ];
  }
  if (intent.mode === 'record_sample' && intent.displayToken) {
    return [
      {
        key: 'sample',
        icon: ICONS.dataFields.sampleId,
        primary: `${EVENT_LOG_COPY.searchIntentSample} ${intent.displayToken}`,
        secondary: intent.displayToken,
        applyValue: intent.displayToken,
      },
    ];
  }
  if (intent.mode === 'record_patient' && intent.displayToken) {
    return [
      {
        key: 'patient',
        icon: ICONS.dataFields.patientId,
        primary: `${EVENT_LOG_COPY.searchIntentPatient} ${intent.displayToken}`,
        secondary: intent.displayToken,
        applyValue: intent.displayToken,
      },
    ];
  }
  if (intent.mode === 'numeric' && intent.textTerm) {
    const term = intent.textTerm;
    const numeric = Number.parseInt(term, 10);
    const orderId = formatDisplayId('order', numeric);
    const patientId = formatDisplayId('patient', numeric);
    const testId = formatDisplayId('orderTest', numeric);
    const sampleId = formatDisplayId('sample', numeric);
    return [
      {
        key: 'numeric-order',
        icon: ICONS.dataFields.orderId,
        primary: `${EVENT_LOG_COPY.searchIntentOrder} ${orderId}`,
        secondary: orderId,
        applyValue: orderId,
      },
      {
        key: 'numeric-patient',
        icon: ICONS.dataFields.patientId,
        primary: `${EVENT_LOG_COPY.searchIntentPatient} ${patientId}`,
        secondary: patientId,
        applyValue: patientId,
      },
      {
        key: 'numeric-test',
        icon: ICONS.dataFields.testId,
        primary: `${EVENT_LOG_COPY.searchIntentTest} ${testId}`,
        secondary: testId,
        applyValue: testId,
      },
      {
        key: 'numeric-sample',
        icon: ICONS.dataFields.sampleId,
        primary: `${EVENT_LOG_COPY.searchIntentSample} ${sampleId}`,
        secondary: sampleId,
        applyValue: sampleId,
      },
      {
        key: 'numeric-target',
        icon: ICONS.dataFields.orderId,
        primary: `${EVENT_LOG_COPY.searchIntentNumericTarget} ${term}`,
        secondary: term,
        applyValue: term,
      },
    ];
  }
  return [];
}

export function buildEventLogSearchMatchGroups(
  draft: string,
  preview: AuditSearchPreviewResponse | undefined,
  previewInSync: boolean,
): EventLogSearchMatchGroup[] {
  const intent = classifyEventLogSearchIntent(draft);
  const groups: EventLogSearchMatchGroup[] = [];

  const recordItems = buildRecordIdItems(intent);
  if (recordItems.length > 0) {
    groups.push({
      id: 'recordIds',
      label: EVENT_LOG_COPY.searchPreviewRecordIds,
      items: recordItems,
    });
  }

  if (previewInSync && preview) {
    if (preview.patients.length > 0) {
      groups.push({
        id: 'patients',
        label: EVENT_LOG_COPY.searchPreviewPatients,
        items: preview.patients.map(patient => ({
          key: `patient-${patient.id}`,
          avatarName: patient.fullName,
          primary: patient.fullName,
          secondary: patient.displayId,
          applyValue: patient.displayId,
        })),
      });
    }
    if (preview.users.length > 0) {
      groups.push({
        id: 'users',
        label: EVENT_LOG_COPY.searchPreviewUsers,
        items: preview.users.map(user => ({
          key: `user-${user.id}`,
          icon: ICONS.dataFields.user,
          primary: user.name,
          secondary: `@${user.username}`,
          applyValue: user.username,
        })),
      });
    }
  }

  return groups;
}

export function countEventLogSearchMatchItems(groups: EventLogSearchMatchGroup[]): number {
  return groups.reduce((sum, group) => sum + group.items.length, 0);
}
