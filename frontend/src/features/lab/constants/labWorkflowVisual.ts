/**
 * Lab workflow / timeline visual registry — one class bundle per lane.
 * Colors come from theme `--workflow-*` tokens (see semantic-light.css + theme files).
 */

import type { BadgeVariant } from '@/components/primitives/badgeHelpers';
import { timelineLaneLabel, type LabTimelineLane, type LabWorkflowStage } from './labCopy';

export interface LabLaneVisual {
  fill: string;
  bar: string;
  text: string;
  badgeVariant: BadgeVariant;
}

const LANE_VISUAL: Record<LabTimelineLane, LabLaneVisual> = {
  sample: {
    fill: 'fill-workflow-collection-fg',
    bar: 'bg-workflow-collection-fg',
    text: 'text-workflow-collection-fg',
    badgeVariant: 'collected',
  },
  results: {
    fill: 'fill-workflow-entry-fg',
    bar: 'bg-workflow-entry-fg',
    text: 'text-workflow-entry-fg',
    badgeVariant: 'warning',
  },
  validation: {
    fill: 'fill-workflow-validation-fg',
    bar: 'bg-workflow-validation-fg',
    text: 'text-workflow-validation-fg',
    badgeVariant: 'validated',
  },
  escalation: {
    fill: 'fill-workflow-escalation-fg',
    bar: 'bg-workflow-escalation-fg',
    text: 'text-workflow-escalation-fg',
    badgeVariant: 'escalated',
  },
  quality: {
    fill: 'fill-workflow-quality-fg',
    bar: 'bg-workflow-quality-fg',
    text: 'text-workflow-quality-fg',
    badgeVariant: 'warning',
  },
  order: {
    fill: 'fill-workflow-order-fg',
    bar: 'bg-workflow-order-fg',
    text: 'text-workflow-order-fg',
    badgeVariant: 'neutral',
  },
  composition: {
    fill: 'fill-workflow-composition-fg',
    bar: 'bg-workflow-composition-fg',
    text: 'text-workflow-composition-fg',
    badgeVariant: 'pending',
  },
};

const LAB_STAGE_LANE: Record<LabWorkflowStage, LabTimelineLane> = {
  collection: 'sample',
  entry: 'results',
  validation: 'validation',
};

export function getLaneVisual(lane: LabTimelineLane): LabLaneVisual {
  return LANE_VISUAL[lane];
}

export function getStageVisual(stage: LabWorkflowStage): LabLaneVisual {
  return getLaneVisual(LAB_STAGE_LANE[stage]);
}

export interface LabLaneDisplay {
  id: LabTimelineLane;
  label: string;
  badgeVariant: BadgeVariant;
  iconClass: string;
}

export function getLaneDisplay(lane: LabTimelineLane): LabLaneDisplay {
  const visual = getLaneVisual(lane);
  return {
    id: lane,
    label: timelineLaneLabel(lane),
    badgeVariant: visual.badgeVariant,
    iconClass: visual.text,
  };
}

/** Backend timeline category for a UI lane (API still uses `specimen`). */
export function timelineLaneToApiCategory(lane: LabTimelineLane): string {
  return lane === 'sample' ? 'specimen' : lane;
}

/** Map API phase/category strings onto UI lanes. */
export function apiCategoryToTimelineLane(value: string | null | undefined): LabTimelineLane | null {
  if (!value) return null;
  if (value === 'specimen' || value === 'sample') return 'sample';
  if (
    value === 'results' ||
    value === 'validation' ||
    value === 'escalation' ||
    value === 'quality' ||
    value === 'order' ||
    value === 'composition'
  ) {
    return value;
  }
  return null;
}
