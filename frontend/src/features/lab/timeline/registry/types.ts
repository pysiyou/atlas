/**
 * Entity timeline registry types — workflow phases and event definitions.
 */

import type { CommandCenterTimelineTone } from '../timelineStyles';
import type { TimelineEvent } from '../../api/commandCenter.api';
import type { FormattedTimelineEvent } from '../timelineDetailBuilders';
import type { LabLaneDisplay } from '../../constants/labWorkflowVisual';

export type EntityTimelinePhase =
  | 'sample'
  | 'results'
  | 'validation'
  | 'escalation'
  | 'composition';

export type EntityEventHandler = (event: TimelineEvent) => FormattedTimelineEvent;

export type EntityPhaseConfig = LabLaneDisplay;

export interface EntityEventDefinition {
  phase: EntityTimelinePhase;
  tone: CommandCenterTimelineTone;
  format: EntityEventHandler;
  /** Override phase for quality_issue_reported when stage=collection */
  qualityIssueCollectionPhase?: EntityTimelinePhase;
}
