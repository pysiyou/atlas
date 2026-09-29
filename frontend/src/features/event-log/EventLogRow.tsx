import React from 'react';
import { InlineHighlight } from '@/components/primitives/InlineHighlight';
import { getLaneVisual, ResultsParameterGrid, type LabTimelineLane } from '@/features/lab';
import { cn } from '@/utils';
import { EVENT_LOG_COPY } from './copy';
import { EVENT_LOG_STYLES, eventLogPartClass } from './styles';
import type { EventLogDomain, EventLogLaboratorySubdomain, ResolvedEventLogItem } from './types';

function laneForDomain(
  domain: EventLogDomain,
  laboratorySubdomain?: EventLogLaboratorySubdomain
): LabTimelineLane {
  if (domain === 'laboratory' && laboratorySubdomain) {
    switch (laboratorySubdomain) {
      case 'sample':
        return 'sample';
      case 'result':
        return 'results';
      case 'validation':
        return 'validation';
      case 'escalation':
        return 'escalation';
      case 'quality':
        return 'quality';
    }
  }
  switch (domain) {
    case 'patient':
      return 'composition';
    case 'order':
      return 'order';
    case 'billing':
      return 'composition';
    case 'reporting':
      return 'composition';
    case 'system':
      return 'order';
    case 'laboratory':
      return 'results';
  }
}

function EventLogSpineNode({ item }: { item: ResolvedEventLogItem }) {
  const lane = laneForDomain(item.domain, item.laboratorySubdomain);
  const visual = getLaneVisual(lane);

  return (
    <div
      className={cn(
        EVENT_LOG_STYLES.spineDot,
        item.isSystemActor ? EVENT_LOG_STYLES.spineDotMuted : visual.bar
      )}
      aria-hidden
    />
  );
}

function EventLogDetailBox({ item }: { item: ResolvedEventLogItem }) {
  const { narrativeLabel, narrativeText, results, resultFlags } = item;
  const hasResults = results && Object.keys(results).length > 0;
  const hasNote = Boolean(narrativeText?.trim());

  if (!hasResults && !hasNote) return null;

  const resultCount = hasResults ? Object.keys(results).length : 0;

  return (
    <div className={EVENT_LOG_STYLES.noteCard}>
      {hasResults ? (
        <>
          <div className={EVENT_LOG_STYLES.noteCardLabel}>
            {EVENT_LOG_COPY.resultsTitle(resultCount)}
          </div>
          <ResultsParameterGrid results={results!} flags={resultFlags} variant="inline" />
        </>
      ) : null}
      {hasNote ? (
        <div
          className={hasResults ? 'mt-space-2 border-t border-border-subtle pt-space-2' : undefined}
        >
          <div className={EVENT_LOG_STYLES.noteCardLabel}>
            {narrativeLabel ?? EVENT_LOG_COPY.narrativeDefaultLabel}
          </div>
          <p className={EVENT_LOG_STYLES.noteCardBody}>{narrativeText}</p>
        </div>
      ) : null}
    </div>
  );
}

export const EventLogRow: React.FC<{ item: ResolvedEventLogItem }> = ({ item }) => {
  const { headline, headlineParts, omitActorInHeadline } = item;
  return (
    <div className={EVENT_LOG_STYLES.row}>
      <div className={EVENT_LOG_STYLES.spineColumn} aria-hidden>
        <div className={EVENT_LOG_STYLES.spineStemTop} />
        <div className={EVENT_LOG_STYLES.spineStemBottom} />
        <div className={EVENT_LOG_STYLES.spineDotSlot}>
          <EventLogSpineNode item={item} />
        </div>
      </div>
      <div className={EVENT_LOG_STYLES.content}>
        <p className={EVENT_LOG_STYLES.headline}>
          {!omitActorInHeadline ? (
            <>
              <span className={EVENT_LOG_STYLES.headlineActor}>{headline.actorName}</span>{' '}
            </>
          ) : null}
          {headlineParts.length > 0 ? (
            headlineParts.map((part, index) => {
              if (part.variant != null) {
                return (
                  <InlineHighlight
                    key={`${part.text}-${index}`}
                    variant={part.variant}
                    icon={part.icon}
                    decoration={part.decoration}
                  >
                    {part.text}
                  </InlineHighlight>
                );
              }
              return (
                <span key={`${part.text}-${index}`} className={cn(eventLogPartClass(part))}>
                  {part.text}
                </span>
              );
            })
          ) : (
            <>
              <span className={EVENT_LOG_STYLES.headlineSecondary}>{headline.verbPhrase} </span>
              <span
                className={cn(eventLogPartClass({ text: headline.targetLabel, emphasis: true }))}
              >
                {headline.targetLabel}
              </span>
            </>
          )}
        </p>
        <EventLogDetailBox item={item} />
        <p className={cn(EVENT_LOG_STYLES.meta, 'mt-0 mb-0')}>
          {item.metaTime}
          <span className="mx-space-1" aria-hidden>
            ·
          </span>
          {item.domainLabel}
          {item.showEventTypeInMeta ? (
            <>
              <span className="mx-space-1" aria-hidden>
                ·
              </span>
              <span className="font-mono text-text-tertiary">{item.record.eventType}</span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
};
