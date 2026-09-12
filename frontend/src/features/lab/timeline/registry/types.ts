/**
 * Entity timeline registry types — workflow phases and event definitions.
 */

import type { IconName } from '@/components';
import type { BadgeVariant } from '@/components/primitives/badgeHelpers';
import type { CommandCenterTimelineTone } from '../timelineStyles';
import type { TimelineEvent } from '../../api/commandCenter.api';
import type { FormattedTimelineEvent } from '../timelineDetailBuilders';

export type EntityTimelinePhase =
  | 'specimen'
  | 'results'
  | 'validation'
  | 'escalation'
  | 'composition';

export type EntityEventHandler = (event: TimelineEvent) => FormattedTimelineEvent;

export interface EntityPhaseConfig {
  id: EntityTimelinePhase;
  label: string;
  icon: IconName;
  badgeVariant: BadgeVariant;
  iconWrapClass: string;
  iconClass: string;
}

export interface EntityEventDefinition {
  phase: EntityTimelinePhase;
  tone: CommandCenterTimelineTone;
  format: EntityEventHandler;
  /** Override phase for quality_issue_reported when stage=collection */
  qualityIssueCollectionPhase?: EntityTimelinePhase;
}
