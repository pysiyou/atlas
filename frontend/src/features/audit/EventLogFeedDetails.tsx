/**
 * Event log row detail blocks (results, notes, debug payload).
 */
import { useMemo } from 'react';
import { RADIUS, TYPE } from '@/components/theme/recipes';
import { parseResultEntry, statusMapFromFlags } from '@/features/lab';
import { cn } from '@/utils';
import { EVENT_LOG_COPY } from './types';
import type { ResolvedEventLogItem } from './types';

const DETAIL_STYLES = {
  section: `${RADIUS.inset} space-y-space-0-5 bg-surface-hover px-space-2 py-space-2`,
  title: `${TYPE.caption} leading-tight font-normal`,
  body: `${TYPE.value} leading-relaxed font-normal m-0`,
  contentClamp: 'line-clamp-2 min-w-0 break-words',
  results: `${TYPE.value} leading-relaxed font-normal min-w-0 line-clamp-2 break-words`,
  line: 'inline whitespace-nowrap',
  lineLabel: 'text-text-tertiary lowercase',
  lineValue: 'text-text-primary',
} as const;

function EventLogResultsList({
  results,
  flags,
}: {
  results: Record<string, unknown>;
  flags?: string[];
}) {
  const flagStatusMap = useMemo(() => statusMapFromFlags(flags), [flags]);
  const entries = Object.entries(results ?? {});

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className={DETAIL_STYLES.results}>
      {entries.map(([key, rawValue], index) => {
        const { resultValue, unit } = parseResultEntry(key, rawValue, flagStatusMap);
        const valueLabel = unit ? `${resultValue} ${unit}` : resultValue;
        return (
          <span
            key={key}
            className={cn(DETAIL_STYLES.line, index < entries.length - 1 && 'mr-space-4')}
          >
            <span className={DETAIL_STYLES.lineLabel}>{key}: </span>
            <span className={DETAIL_STYLES.lineValue}>{valueLabel}</span>
          </span>
        );
      })}
    </div>
  );
}

/**
 * Optional note / results / debug blocks under an event headline.
 */
export function EventLogDetailBox({ item }: { item: ResolvedEventLogItem }) {
  const { narrativeLabel, narrativeText, results, resultFlags, debugPayload } = item;
  const hasResults = results && Object.keys(results).length > 0;
  const hasNote = Boolean(narrativeText?.trim());
  const hasDebug = Boolean(debugPayload && Object.keys(debugPayload).length > 0);

  if (!hasResults && !hasNote && !hasDebug) return null;

  return (
    <>
      {hasResults ? (
        <div className={DETAIL_STYLES.section}>
          <div className={DETAIL_STYLES.title}>{EVENT_LOG_COPY.resultTitle}</div>
          <EventLogResultsList results={results!} flags={resultFlags} />
        </div>
      ) : null}
      {hasNote ? (
        <div className={DETAIL_STYLES.section}>
          <div className={DETAIL_STYLES.title}>
            {narrativeLabel ?? EVENT_LOG_COPY.narrativeDefaultLabel}
          </div>
          <p className={cn(DETAIL_STYLES.body, DETAIL_STYLES.contentClamp)}>{narrativeText}</p>
        </div>
      ) : null}
      {hasDebug ? (
        <div className={DETAIL_STYLES.section}>
          <div className={DETAIL_STYLES.title}>{EVENT_LOG_COPY.debugTitle}</div>
          <pre className={cn(DETAIL_STYLES.body, 'whitespace-pre-wrap break-all font-mono')}>
            {JSON.stringify(debugPayload, null, 2)}
          </pre>
        </div>
      ) : null}
    </>
  );
}
