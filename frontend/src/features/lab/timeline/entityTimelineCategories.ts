/**
 * Entity timeline categories — derived from the entity event registry.
 */

import type { TimelineEvent } from '../api/commandCenter.api';
import type { CommandCenterTimelineTone } from '../command-center/components/styles';
import {
  ENTITY_PHASE_CONFIG,
  resolveEntityPhase,
  resolveEntityTone,
  type EntityPhaseConfig,
  type EntityTimelinePhase,
} from './registry';

export type EntityTimelineCategory = EntityTimelinePhase;

export type EntityTimelineCategoryConfig = EntityPhaseConfig;

export function getEntityEventCategory(event: TimelineEvent): EntityTimelineCategory {
  return resolveEntityPhase(event);
}

export function getEntityEventTone(event: TimelineEvent): CommandCenterTimelineTone {
  return resolveEntityTone(event);
}

export function getEntityCategoryConfig(
  category: EntityTimelineCategory,
): EntityTimelineCategoryConfig {
  return ENTITY_PHASE_CONFIG[category];
}
