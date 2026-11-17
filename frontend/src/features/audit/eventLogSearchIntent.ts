/**
 * Event log search intent classification and match-group builders (pure).
 */
import {
  classifyClinicalSearch,
  compactIdentifier,
  looksLikeAccession,
  looksLikeFiller,
  looksLikeMnemonic,
  looksLikeMrn,
} from '@/utils/id';
import type { IconKey } from '@/icons';
import { IconKeys } from '@/icons';
import type { AuditSearchPreviewResponse } from './api';
import { parseRecordFilterDisplayId } from './eventLogPanelState';
import { getEventLogCopy } from '@/strings';

export type EventLogSearchIntentMode =
  | 'empty'
  | 'record_order'
  | 'record_test'
  | 'record_sample'
  | 'record_patient'
  | 'text';

export type EventLogSearchDimension = 'patientName' | 'actorName' | 'username';

export interface EventLogSearchParsedIds {
  orderId?: string;
  testId?: number;
  sampleId?: string;
  patientId?: string;
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

  const parsed = parseRecordFilterDisplayId(trimmed);
  if (parsed.kind === 'clinical') {
    const token = parsed.token;
    let classified: EventLogSearchIntentMode = 'record_patient';
    const slashIdx = token.indexOf('/');
    if (slashIdx > 0) {
      const accPart = token.slice(0, slashIdx).trim();
      const codePart = token.slice(slashIdx + 1).trim();
      if (looksLikeAccession(accPart) && looksLikeMnemonic(codePart)) {
        classified = 'record_test';
      }
    } else if (looksLikeMnemonic(token)) {
      classified = 'record_test';
    } else if (looksLikeFiller(token)) {
      classified = 'record_order';
    } else if (looksLikeAccession(token)) {
      classified = 'record_sample';
    } else if (looksLikeMrn(token)) {
      classified = 'record_patient';
    } else {
      const kind = classifyClinicalSearch(compactIdentifier(token));
      if (kind === 'filler') classified = 'record_order';
      else if (kind === 'accession') classified = 'record_sample';
      else if (kind === 'mrn') classified = 'record_patient';
      else if (kind === 'mnemonic') classified = 'record_test';
    }
    return {
      mode: classified,
      textTerm: null,
      dimensions: [],
      parsedIds: null,
      displayToken: token,
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
  icon?: IconKey;
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
        icon: IconKeys.dataFields.document,
        primary: `${getEventLogCopy().searchIntentOrder} ${intent.displayToken}`,
        secondary: intent.displayToken,
        applyValue: intent.displayToken,
      },
    ];
  }
  if (intent.mode === 'record_test' && intent.displayToken) {
    return [
      {
        key: 'test',
        icon: IconKeys.dataFields.testId,
        primary: `${getEventLogCopy().searchIntentTest} ${intent.displayToken}`,
        secondary: intent.displayToken,
        applyValue: intent.displayToken,
      },
    ];
  }
  if (intent.mode === 'record_sample' && intent.displayToken) {
    return [
      {
        key: 'sample',
        icon: IconKeys.dataFields.sampleId,
        primary: `${getEventLogCopy().searchIntentSample} ${intent.displayToken}`,
        secondary: intent.displayToken,
        applyValue: intent.displayToken,
      },
    ];
  }
  if (intent.mode === 'record_patient' && intent.displayToken) {
    return [
      {
        key: 'patient',
        icon: IconKeys.dataFields.patientId,
        primary: `${getEventLogCopy().searchIntentPatient} ${intent.displayToken}`,
        secondary: intent.displayToken,
        applyValue: intent.displayToken,
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
      label: getEventLogCopy().searchPreviewRecordIds,
      items: recordItems,
    });
  }

  if (previewInSync && preview) {
    if (preview.patients.length > 0) {
      groups.push({
        id: 'patients',
        label: getEventLogCopy().searchPreviewPatients,
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
        label: getEventLogCopy().searchPreviewUsers,
        items: preview.users.map(user => ({
          key: `user-${user.id}`,
          icon: IconKeys.dataFields.user,
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
