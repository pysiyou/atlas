/**
 * Entity timeline event registry — single source for phase, tone, and formatting.
 */
/* eslint-disable max-lines -- consolidated event handler registry */

import { displayId } from '@/utils';
import { ICONS } from '@/config/icons';
import type { TimelineEvent } from '../../api/commandCenter.api';
import {
  appendNote,
  formatTestCodes,
  metaString,
  sampleRef,
  testRef,
  testTransitionDetails,
  type EventDetail,
  type FormattedTimelineEvent,
} from '../timelineDetailBuilders';
import type { EntityEventDefinition, EntityPhaseConfig, EntityTimelinePhase } from './types';

function testEntityDetails(meta: Record<string, unknown>, testId?: number): EventDetail[] {
  const details: EventDetail[] = [];
  const test = testRef(testId ?? meta.orderTestId ?? meta.escalatedTestId);
  if (test) details.push(test);
  const code = formatTestCodes(meta);
  if (code !== 'Test') details.push({ type: 'testCode', value: code });
  return details;
}

function reasonDetail(reason: unknown): EventDetail[] {
  const text = metaString(reason);
  return text ? [{ type: 'text', value: text }] : [];
}

function remedyDetail(event: TimelineEvent): EventDetail[] {
  const remedy =
    metaString(event.metadata.remedy) ?? metaString(event.afterState?.remedy);
  return remedy
    ? [{ type: 'text', value: '→' }, { type: 'text', value: remedy.replace(/_/g, ' ') }]
    : [];
}

const ESCALATION_TRIGGER_LABELS: Record<string, string> = {
  escalation_trigger_crit_val: 'Escalation opened — critical value',
  escalation_trigger_limit_hit: 'Escalation opened — retest limit reached',
  escalation_trigger_rej_samp: 'Escalation opened — rejected sample',
  escalation_trigger_amend_res: 'Escalation opened — result amendment',
};

const ESCALATION_RESOLUTION_LABELS: Record<string, string> = {
  escalation_resolution_authorize_retest: 'Supervisor authorized retest',
  escalation_resolution_authorize_recollect: 'Supervisor authorized recollection',
  escalation_resolution_force_validate: 'Supervisor force-validated results',
  escalation_resolution_apply_amendment: 'Amended results applied and validated',
  escalation_resolution_cancel_test: 'Supervisor cancelled test',
};

function escalationTriggerHandler(event: TimelineEvent): FormattedTimelineEvent {
  const meta = event.metadata;
  const details: EventDetail[] = testEntityDetails(meta, event.entityId);
  const reason = metaString(meta.reasonCode);
  if (reason) details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
  return {
    action: ESCALATION_TRIGGER_LABELS[event.type] ?? 'Escalation opened',
    details,
  };
}

function escalationResolutionHandler(event: TimelineEvent): FormattedTimelineEvent {
  const meta = event.metadata;
  const details: EventDetail[] = [
    { type: 'testCode', value: formatTestCodes(meta) },
    ...testTransitionDetails(meta, event),
  ];
  const reason = metaString(meta.reason);
  if (reason) details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
  const newSample = sampleRef(meta.newSampleId);
  if (newSample) details.push({ type: 'text', value: '→' }, newSample);
  return {
    action: ESCALATION_RESOLUTION_LABELS[event.type] ?? 'Escalation resolved',
    details,
  };
}

export const ENTITY_PHASE_CONFIG: Record<EntityTimelinePhase, EntityPhaseConfig> = {
  specimen: {
    id: 'specimen',
    label: 'Specimen',
    icon: ICONS.lab.sampleTube,
    badgeVariant: 'collected',
    iconWrapClass: 'bg-info-bg border-info-fg/15',
    iconClass: 'text-info-fg-emphasis',
  },
  results: {
    id: 'results',
    label: 'Results',
    icon: ICONS.lab.flask,
    badgeVariant: 'warning',
    iconWrapClass: 'bg-warning-bg border-warning-fg/15',
    iconClass: 'text-warning-fg-emphasis',
  },
  validation: {
    id: 'validation',
    label: 'Validation',
    icon: ICONS.actions.checkCircle,
    badgeVariant: 'validated',
    iconWrapClass: 'bg-success-bg border-success-fg/15',
    iconClass: 'text-success-fg-emphasis',
  },
  escalation: {
    id: 'escalation',
    label: 'Escalation',
    icon: ICONS.actions.alertCircle,
    badgeVariant: 'escalated',
    iconWrapClass: 'bg-danger-bg border-danger-fg/15',
    iconClass: 'text-danger-fg-emphasis',
  },
  composition: {
    id: 'composition',
    label: 'Composition',
    icon: ICONS.actions.edit,
    badgeVariant: 'pending',
    iconWrapClass: 'bg-surface-secondary border-border',
    iconClass: 'text-text-secondary',
  },
};

export const ENTITY_EVENT_REGISTRY: Record<string, EntityEventDefinition> = {
  sample_collect: {
    phase: 'specimen',
    tone: 'neutral',
    format: event => {
      const meta = event.metadata;
      const details: EventDetail[] = [
        sampleRef(event.entityId) ?? { type: 'id', value: displayId.sample(event.entityId) },
      ];
      const code = formatTestCodes(meta);
      if (code !== 'Test') {
        details.push({ type: 'text', value: 'for' }, { type: 'testCode', value: code });
      }
      const sampleType = meta.sampleType;
      if (typeof sampleType === 'string') details.push({ type: 'sampleType', value: sampleType });
      return { action: 'Sample collected', details };
    },
  },
  sample_reject: {
    phase: 'specimen',
    tone: 'problem',
    format: event => {
      const details: EventDetail[] = [
        sampleRef(event.entityId) ?? { type: 'id', value: displayId.sample(event.entityId) },
      ];
      const reason = metaString(event.metadata.rejectionReason) ?? 'Quality issue';
      details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
      if (event.metadata.recollectionRequired === true) {
        details.push({ type: 'text', value: '→' }, { type: 'text', value: 'recollection required' });
      }
      return { action: 'Sample rejected', details };
    },
  },
  sample_recollection_request: {
    phase: 'specimen',
    tone: 'problem',
    format: event => {
      const meta = event.metadata;
      const details: EventDetail[] = [
        sampleRef(event.entityId) ?? { type: 'id', value: displayId.sample(event.entityId) },
        { type: 'text', value: 'replacing' },
        ...(sampleRef(meta.originalSampleId) ? [sampleRef(meta.originalSampleId)!] : []),
      ];
      const reason = metaString(meta.recollectionReason);
      if (reason) details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
      const attempt = meta.recollectionAttempt;
      if (typeof attempt === 'number' && attempt > 0) {
        details.push({ type: 'text', value: `(attempt ${attempt})` });
      }
      return { action: 'Recollection tube created', details };
    },
  },
  recollection_request_created: {
    phase: 'specimen',
    tone: 'problem',
    format: event => {
      const meta = event.metadata;
      const details: EventDetail[] = [];
      const rejected = sampleRef(meta.rejectedSampleId);
      if (rejected) details.push(rejected);
      const stage = metaString(meta.stage);
      if (stage) details.push({ type: 'text', value: 'at' }, { type: 'text', value: stage });
      const reason = metaString(meta.reason);
      if (reason) details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
      return { action: 'Recollection pending supervisor approval', details };
    },
  },
  recollection_request_approved: {
    phase: 'specimen',
    tone: 'resolution',
    format: event => {
      const details: EventDetail[] = [];
      const created = sampleRef(event.metadata.createdSampleId);
      if (created) details.push({ type: 'text', value: '→' }, created);
      const newTest = testRef(event.metadata.createdTestId);
      if (newTest) details.push(newTest);
      return { action: 'Recollection approved', details };
    },
  },
  recollection_request_denied: {
    phase: 'specimen',
    tone: 'problem',
    format: event => {
      const details: EventDetail[] = [];
      const note = metaString(event.metadata.reviewNotes);
      if (note) details.push({ type: 'note', value: note });
      return { action: 'Recollection denied', details };
    },
  },
  result_entry: {
    phase: 'results',
    tone: 'neutral',
    format: event => ({
      action: 'Results recorded',
      details: testEntityDetails(event.metadata, event.entityId),
    }),
  },
  result_validation_approve: {
    phase: 'validation',
    tone: 'resolution',
    format: event => {
      const details = testEntityDetails(event.metadata, event.entityId);
      const notes = metaString(event.metadata.validationNotes);
      if (notes) details.push({ type: 'note', value: notes });
      return { action: 'Results validated', details };
    },
  },
  quality_issue_reported: {
    phase: 'validation',
    tone: 'problem',
    qualityIssueCollectionPhase: 'specimen',
    format: event => {
      const meta = event.metadata;
      const stage = metaString(meta.stage) ?? metaString(event.afterState?.stage);
      const domain = metaString(meta.domain) ?? metaString(event.afterState?.domain);
      const reason = metaString(meta.reason);
      const details: EventDetail[] = [...testTransitionDetails(meta, event)];
      const code = formatTestCodes(meta);
      if (code !== 'Test') details.push({ type: 'testCode', value: code });
      const linkedSample = sampleRef(meta.sampleId ?? meta.newSampleId);
      if (linkedSample) details.push(linkedSample);
      if (reason) details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
      details.push(...remedyDetail(event));
      const createdSample = sampleRef(meta.newSampleId);
      if (createdSample && !meta.newTestId) {
        details.push({ type: 'text', value: '→' }, createdSample);
      }
      let action = 'Quality issue reported';
      if (stage === 'collection' || domain === 'specimen') {
        action = 'Specimen rejected';
      } else if (stage === 'validation' || domain === 'results') {
        action = 'Results rejected at validation';
      }
      return { action, details };
    },
  },
  critical_value_detected: {
    phase: 'results',
    tone: 'problem',
    format: event => {
      const meta = event.metadata;
      const details: EventDetail[] = testEntityDetails(meta, event.entityId);
      const values = meta.criticalValues;
      if (Array.isArray(values) && values.length > 0) {
        const summary = values
          .map(item => {
            if (!item || typeof item !== 'object') return null;
            const row = item as Record<string, unknown>;
            const name = row.item_name ?? row.itemName ?? row.item_code ?? row.itemCode;
            const value = row.value;
            const unit = row.unit;
            if (!name || value == null) return null;
            return unit ? `${name}: ${value} ${unit}` : `${name}: ${value}`;
          })
          .filter(Boolean)
          .join(', ');
        if (summary) details.push({ type: 'text', value: '—' }, { type: 'text', value: summary });
      }
      return { action: 'Critical value detected', details };
    },
  },
  critical_value_notified: {
    phase: 'results',
    tone: 'problem',
    format: event => {
      const meta = event.metadata;
      const details: EventDetail[] = [
        ...testEntityDetails(meta, event.entityId),
        { type: 'text', value: '→' },
        { type: 'text', value: (meta.notifiedTo as string) || 'Provider' },
      ];
      const method = metaString(meta.notificationMethod);
      if (method) details.push({ type: 'text', value: `via ${method}` });
      return { action: 'Provider notified of critical value', details };
    },
  },
  critical_value_acknowledged: {
    phase: 'results',
    tone: 'resolution',
    format: event => {
      const meta = event.metadata;
      const details: EventDetail[] = [
        ...testEntityDetails(meta, event.entityId),
        { type: 'text', value: 'by' },
        { type: 'text', value: (meta.acknowledgedBy as string) || 'Provider' },
      ];
      return { action: 'Critical value acknowledged', details };
    },
  },
  test_added: {
    phase: 'composition',
    tone: 'neutral',
    format: event => ({
      action: 'Test added to order',
      details: [
        { type: 'testCode', value: formatTestCodes(event.metadata) },
        ...testEntityDetails(event.metadata, event.entityId),
      ],
    }),
  },
  test_removed: {
    phase: 'composition',
    tone: 'problem',
    format: event => ({
      action: 'Test removed from order',
      details: [
        { type: 'testCode', value: formatTestCodes(event.metadata) },
        ...reasonDetail(event.metadata.reason),
      ],
    }),
  },
};

for (const type of Object.keys(ESCALATION_TRIGGER_LABELS)) {
  ENTITY_EVENT_REGISTRY[type] = {
    phase: 'escalation',
    tone: 'problem',
    format: escalationTriggerHandler,
  };
}

for (const type of Object.keys(ESCALATION_RESOLUTION_LABELS)) {
  ENTITY_EVENT_REGISTRY[type] = {
    phase: 'escalation',
    tone: 'resolution',
    format: escalationResolutionHandler,
  };
}

export function resolveEntityPhase(event: TimelineEvent): EntityTimelinePhase {
  const apiPhase = event.phase;
  if (
    apiPhase === 'specimen' ||
    apiPhase === 'results' ||
    apiPhase === 'validation' ||
    apiPhase === 'escalation' ||
    apiPhase === 'composition'
  ) {
    return apiPhase;
  }

  const definition = ENTITY_EVENT_REGISTRY[event.type];
  if (!definition) return 'validation';

  if (event.type === 'quality_issue_reported') {
    const stage =
      metaString(event.metadata.stage) ?? metaString(event.afterState?.stage) ?? '';
    if (stage === 'collection' && definition.qualityIssueCollectionPhase) {
      return definition.qualityIssueCollectionPhase;
    }
  }

  return definition.phase;
}

export function resolveEntityTone(event: TimelineEvent): 'neutral' | 'problem' | 'resolution' {
  const apiTone = event.tone;
  if (apiTone === 'neutral' || apiTone === 'problem' || apiTone === 'resolution') {
    return apiTone;
  }
  const definition = ENTITY_EVENT_REGISTRY[event.type];
  if (definition) return definition.tone;
  const { type } = event;
  if (type.includes('reject') || type.startsWith('escalation_trigger_')) return 'problem';
  if (type.startsWith('escalation_resolution_')) return 'resolution';
  return 'neutral';
}

export function formatEntityEvent(event: TimelineEvent): FormattedTimelineEvent {
  const definition = ENTITY_EVENT_REGISTRY[event.type];
  const formatted = definition
    ? definition.format(event)
    : {
        action: event.type.replace(/_/g, ' '),
        details: fallbackDetails(event),
      };
  return appendNote(event, formatted);
}

function fallbackDetails(event: TimelineEvent): EventDetail[] {
  const { entityType, entityId, metadata } = event;
  if (entityType === 'sample') {
    return [sampleRef(entityId) ?? { type: 'id', value: displayId.sample(entityId) }];
  }
  if (entityType === 'test' || entityType === 'order_test') {
    return testEntityDetails(metadata, entityId);
  }
  return [{ type: 'id', value: String(entityId) }];
}
