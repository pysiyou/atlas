/**
 * Rich labels for search preview — keep interpretation aligned with audit/search.py apply_unified_search.
 */
import type { IconName } from '@/components';
import { ICONS } from '@/config/icons';
import { EVENT_LOG_COPY } from './types';
import type {
  EventLogSearchDimension,
  EventLogSearchIntent,
  EventLogSearchIntentMode,
} from './eventLogSearchIntent';

export interface EventLogSearchCriterion {
  key: string;
  icon: IconName;
  title: string;
  detail: string;
  emphasis?: string;
}

const DIMENSION_COPY: Record<EventLogSearchDimension, { title: string; detail: string }> = {
  patientName: {
    title: EVENT_LOG_COPY.searchIntentPatientName,
    detail: EVENT_LOG_COPY.searchIntentPatientNameDetail,
  },
  actorName: {
    title: EVENT_LOG_COPY.searchIntentActorName,
    detail: EVENT_LOG_COPY.searchIntentActorNameDetail,
  },
  username: {
    title: EVENT_LOG_COPY.searchIntentUsername,
    detail: EVENT_LOG_COPY.searchIntentUsernameDetail,
  },
};

const DIMENSION_ICONS: Record<EventLogSearchDimension, IconName> = {
  patientName: ICONS.dataFields.user,
  actorName: ICONS.dataFields.userHands,
  username: ICONS.dataFields.user,
};

export function eventLogSearchModeLabel(mode: EventLogSearchIntentMode): string {
  if (mode === 'entity_order' || mode === 'entity_test' || mode === 'entity_sample' || mode === 'entity_patient') {
    return EVENT_LOG_COPY.searchPreviewModeEntity;
  }
  if (mode === 'numeric') return EVENT_LOG_COPY.searchPreviewModeNumeric;
  if (mode === 'text') return EVENT_LOG_COPY.searchPreviewModeText;
  return '';
}

export function getEventLogSearchCriteria(intent: EventLogSearchIntent): EventLogSearchCriterion[] {
  if (intent.mode === 'empty') return [];

  if (intent.mode === 'entity_order' && intent.displayToken) {
    return [
      {
        key: 'order',
        icon: ICONS.dataFields.document,
        title: `${EVENT_LOG_COPY.searchIntentOrder} ${intent.displayToken}`,
        detail: EVENT_LOG_COPY.searchIntentOrderDetail,
        emphasis: intent.displayToken,
      },
    ];
  }
  if (intent.mode === 'entity_test' && intent.displayToken) {
    return [
      {
        key: 'test',
        icon: ICONS.dataFields.testId,
        title: `${EVENT_LOG_COPY.searchIntentTest} ${intent.displayToken}`,
        detail: EVENT_LOG_COPY.searchIntentTestDetail,
        emphasis: intent.displayToken,
      },
    ];
  }
  if (intent.mode === 'entity_sample' && intent.displayToken) {
    return [
      {
        key: 'sample',
        icon: ICONS.dataFields.sampleId,
        title: `${EVENT_LOG_COPY.searchIntentSample} ${intent.displayToken}`,
        detail: EVENT_LOG_COPY.searchIntentSampleDetail,
        emphasis: intent.displayToken,
      },
    ];
  }
  if (intent.mode === 'entity_patient' && intent.displayToken) {
    return [
      {
        key: 'patient',
        icon: ICONS.dataFields.patientId,
        title: `${EVENT_LOG_COPY.searchIntentPatient} ${intent.displayToken}`,
        detail: EVENT_LOG_COPY.searchIntentPatientDetail,
        emphasis: intent.displayToken,
      },
    ];
  }
  if (intent.mode === 'numeric' && intent.textTerm) {
    const term = intent.textTerm;
    return [
      {
        key: 'numeric-order',
        icon: ICONS.dataFields.orderId,
        title: EVENT_LOG_COPY.searchIntentNumeric,
        detail: EVENT_LOG_COPY.searchIntentNumericOrderDetail,
        emphasis: term,
      },
      {
        key: 'numeric-patient',
        icon: ICONS.dataFields.patientId,
        title: EVENT_LOG_COPY.searchIntentNumeric,
        detail: EVENT_LOG_COPY.searchIntentNumericPatientDetail,
        emphasis: term,
      },
      {
        key: 'numeric-test',
        icon: ICONS.dataFields.testId,
        title: EVENT_LOG_COPY.searchIntentNumeric,
        detail: EVENT_LOG_COPY.searchIntentNumericTestDetail,
        emphasis: term,
      },
      {
        key: 'numeric-target',
        icon: ICONS.dataFields.orderId,
        title: EVENT_LOG_COPY.searchIntentNumeric,
        detail: EVENT_LOG_COPY.searchIntentNumericTargetDetail,
        emphasis: term,
      },
    ];
  }

  const term = intent.textTerm ?? '';
  return intent.dimensions.map(dim => ({
    key: dim,
    icon: DIMENSION_ICONS[dim],
    title: `${DIMENSION_COPY[dim].title} contains “${term}”`,
    detail: DIMENSION_COPY[dim].detail,
    emphasis: term,
  }));
}
