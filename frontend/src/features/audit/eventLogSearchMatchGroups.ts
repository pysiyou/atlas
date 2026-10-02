/**
 * Categorized searchable matches for the event log popover — aligned with audit/search.py.
 */
import type { IconName } from '@/components';
import { ICONS } from '@/config/icons';
import { formatDisplayId } from '@/utils/id';
import type { AuditSearchPreviewResponse } from './api';
import { classifyEventLogSearchIntent, type EventLogSearchIntent } from './eventLogSearchIntent';
import { EVENT_LOG_COPY } from './types';

export type EventLogSearchMatchCategoryId = 'entityIds' | 'patients' | 'users';

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

function buildEntityIdItems(intent: EventLogSearchIntent): EventLogSearchMatchItem[] {
  if (intent.mode === 'entity_order' && intent.displayToken) {
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
  if (intent.mode === 'entity_test' && intent.displayToken) {
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
  if (intent.mode === 'entity_sample' && intent.displayToken) {
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
  if (intent.mode === 'entity_patient' && intent.displayToken) {
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
  previewInSync: boolean
): EventLogSearchMatchGroup[] {
  const intent = classifyEventLogSearchIntent(draft);
  const groups: EventLogSearchMatchGroup[] = [];

  const entityItems = buildEntityIdItems(intent);
  if (entityItems.length > 0) {
    groups.push({
      id: 'entityIds',
      label: EVENT_LOG_COPY.searchPreviewEntityIds,
      items: entityItems,
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
