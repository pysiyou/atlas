/**
 * Shared workflow stage labels for lab detail modals.
 */

import React from 'react';
import { TYPE } from '@/components/theme/recipes';
import { LAB_COPY, labStageLabel, type LabWorkflowStage } from '../constants/labConstants';

export type LabModalStage = LabWorkflowStage | 'escalation';

export function labModalStageLabel(stage: LabModalStage): string {
  return stage === 'escalation' ? LAB_COPY.workflow.escalation : labStageLabel(stage, 'full');
}

export function labModalSubtitle(stage: LabModalStage): React.ReactNode {
  return (
    <span className={`${TYPE.caption} uppercase tracking-widest font-light`}>
      {labModalStageLabel(stage)}
    </span>
  );
}
