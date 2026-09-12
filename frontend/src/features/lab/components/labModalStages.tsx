/**
 * Shared workflow stage labels for lab detail modals.
 */

import React from 'react';

export type LabModalStage = 'collection' | 'entry' | 'validation' | 'escalation';

const STAGE_LABELS: Record<LabModalStage, string> = {
  collection: 'Collection',
  entry: 'Result Entry',
  validation: 'Validation',
  escalation: 'Escalation',
};

export function labModalStageLabel(stage: LabModalStage): string {
  return STAGE_LABELS[stage];
}

export function labModalSubtitle(stage: LabModalStage): React.ReactNode {
  return (
    <span className="text-xxs uppercase tracking-widest text-text-tertiary font-light">
      {STAGE_LABELS[stage]}
    </span>
  );
}
