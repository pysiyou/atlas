/**
 * Event log row detail blocks (results, notes, debug payload).
 */
import { useMemo } from 'react';
import { TYPE } from '@/components/theme/recipes';
import { parseResultEntry, ResultValueAnnotations, statusMapFromFlags } from '@/features/lab';
import { resolveParameterLabel, useParameterLabelMap } from '@/features/catalog';
import { cn } from '@/utils';
import { collectTestCodes } from './catalog';
import { EVENT_LOG_COPY } from './types';
import type { ResolvedEventLogItem } from './types';

const DETAIL_STYLES = {
  row: `pl-space-4 mt-space-0-5 ${TYPE.value} leading-relaxed font-normal min-w-0 m-0`,
  label: 'text-text-tertiary',
  contentClamp: 'line-clamp-2 break-words',
  results: 'inline min-w-0 line-clamp-2 break-words',
  line: 'inline whitespace-nowrap align-baseline',
  lineLabel: 'text-text-tertiary lowercase',
} as const;

function EventLogResultsList({
  results,
  flags,
  testCode,
}: {
  results: Record<string, unknown>;
  flags?: string[];
  testCode?: string;
}) {
  const flagStatusMap = useMemo(() => statusMapFromFlags(flags), [flags]);
  const parameterLabels = useParameterLabelMap(testCode);
  const entries = Object.entries(results ?? {});

  if (entries.length === 0) {
    return null;
  }

  return (
    <span className={DETAIL_STYLES.results}>
      {entries.map(([key, rawValue], index) => {
        const { resultValue, unit, status } = parseResultEntry(key, rawValue, flagStatusMap);
        return (
          <span
            key={key}
            className={cn(DETAIL_STYLES.line, index < entries.length - 1 && 'mr-space-4')}
          >
            <span className={DETAIL_STYLES.lineLabel}>
              {resolveParameterLabel(key, parameterLabels)}:{' '}
            </span>
            <ResultValueAnnotations
              resultValue={resultValue}
              unit={unit}
              status={status}
              dense
            />
          </span>
        );
      })}
    </span>
  );
}

/**
 * Optional note / results / debug blocks under an event headline.
 */
export function EventLogDetailBox({ item }: { item: ResolvedEventLogItem }) {
  const { narrativeLabel, narrativeText, results, resultFlags, debugPayload, record } = item;
  const testCode = collectTestCodes(record)[0];
  const hasResults = results && Object.keys(results).length > 0;
  const hasNote = Boolean(narrativeText?.trim());
  const hasDebug = Boolean(debugPayload && Object.keys(debugPayload).length > 0);

  if (!hasResults && !hasNote && !hasDebug) return null;

  const noteLabel = narrativeLabel ?? EVENT_LOG_COPY.narrativeDefaultLabel;

  return (
    <>
      {hasResults ? (
        <div className={cn(DETAIL_STYLES.row, DETAIL_STYLES.contentClamp)}>
          <span className={DETAIL_STYLES.label}>{EVENT_LOG_COPY.resultTitle}: </span>
          <EventLogResultsList results={results!} flags={resultFlags} testCode={testCode} />
        </div>
      ) : null}
      {hasNote ? (
        <p className={cn(DETAIL_STYLES.row, DETAIL_STYLES.contentClamp)}>
          <span className={DETAIL_STYLES.label}>{noteLabel}: </span>
          {narrativeText}
        </p>
      ) : null}
      {hasDebug ? (
        <div className={DETAIL_STYLES.row}>
          <span className={DETAIL_STYLES.label}>{EVENT_LOG_COPY.debugTitle}: </span>
          <pre className="mt-space-0-5 whitespace-pre-wrap break-all font-mono text-text-primary">
            {JSON.stringify(debugPayload, null, 2)}
          </pre>
        </div>
      ) : null}
    </>
  );
}
