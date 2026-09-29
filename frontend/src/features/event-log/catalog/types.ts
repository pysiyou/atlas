import type {
  EventLogDomain,
  EventLogHeadlinePart,
  EventLogLaboratorySubdomain,
  EventLogRecord,
} from '../types';
import type { EventLogHeadlineContext } from '../headline/context';

export type TrailingActorPolicy = 'human' | 'never';

export type HeadlineBuilder = (
  record: EventLogRecord,
  context: EventLogHeadlineContext
) => EventLogHeadlinePart[];

export interface EventCatalogEntry {
  domain: EventLogDomain;
  laboratorySubdomain?: EventLogLaboratorySubdomain;
  domainLabel: string;
  verbPhrase: string;
  headlineMetaKeys?: readonly string[];
  /** Leading actor name (login/logout only). */
  leadingActor?: boolean;
  trailingActor?: TrailingActorPolicy;
  /** Hide system actor; no trailing " by " (e.g. auto sample label). */
  treatAsSystemActor?: boolean;
  buildHeadline: HeadlineBuilder;
}
