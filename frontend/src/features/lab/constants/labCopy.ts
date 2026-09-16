/**
 * Lab user-facing terminology — single source for stage, entity, and attention copy.
 * API enum values (e.g. QualityDomain.specimen) stay on the wire; map to these labels at the UI.
 */

export type LabWorkflowStage = 'collection' | 'entry' | 'validation';

export type LabStageLabelVariant = 'short' | 'nav' | 'full';

export type LabTimelineLane =
  | 'sample'
  | 'results'
  | 'validation'
  | 'escalation'
  | 'quality'
  | 'order'
  | 'composition';

export const LAB_COPY = {
  entity: {
    sample: 'Sample',
    sampleType: 'Sample type',
    samples: 'samples',
  },
  workflow: {
    collection: 'Collection',
    collectionNav: 'Sample Collection',
    entry: 'Result Entry',
    entryShort: 'Entry',
    validation: 'Validation',
    commandCenterNav: 'Command Center',
    escalation: 'Escalation',
  },
  quality: {
    sampleRejected: 'Sample rejected',
    sampleIssue: 'Sample issue',
    reportSampleIssue: 'Report Sample Issue',
  },
  attention: {
    criticalValue: 'Critical value',
    recollection: 'Recollection',
  },
  timeline: {
    sample: 'Sample',
    results: 'Results',
    validation: 'Validation',
    escalation: 'Escalation',
    quality: 'Quality',
    order: 'Order',
    composition: 'Composition',
  },
} as const;

export function labStageLabel(
  stage: LabWorkflowStage,
  variant: LabStageLabelVariant = 'full',
): string {
  switch (stage) {
    case 'collection':
      return variant === 'nav' ? LAB_COPY.workflow.collectionNav : LAB_COPY.workflow.collection;
    case 'entry':
      return variant === 'short' ? LAB_COPY.workflow.entryShort : LAB_COPY.workflow.entry;
    case 'validation':
      return LAB_COPY.workflow.validation;
  }
}

export function timelineLaneLabel(lane: LabTimelineLane): string {
  return LAB_COPY.timeline[lane];
}

/** Compact pipeline rows (command center KPIs, donuts, wait bars). */
export const LAB_STAGE_SHORT_ROWS = [
  { key: 'collection' as const, label: labStageLabel('collection', 'short') },
  { key: 'entry' as const, label: labStageLabel('entry', 'short') },
  { key: 'validation' as const, label: labStageLabel('validation', 'short') },
] as const;
