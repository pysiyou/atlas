/**
 * Read-only parameter display — inline (validation card) or tile (entry) layouts.
 */
import React, { useMemo } from 'react';
import { cn } from '@/utils';
import { parseResultEntry, statusMapFromFlags, isCritical } from '../utils/labResult';
import { LAB_CONFIG } from '../constants';
import { TONE, TYPE } from '@/components/theme/recipes';
import {
  RESULT_PANEL,
  resultTileStatusClass,
  resultValueClass,
  resultStatusLabel,
} from '../utils/labResult';

export type ResultsGridVariant = 'inline' | 'tiles';

interface ResultsParameterGridProps {
  results: Record<string, unknown>;
  flags?: string[];
  variant?: ResultsGridVariant;
  /** Card-style 4-column cap (validation card mobile). */
  dense?: boolean;
}

function inlineValueClass(status: ReturnType<typeof parseResultEntry>['status']): string {
  if (isCritical(status)) return TONE.danger.fg;
  if (status !== 'normal') return 'text-warning-fg';
  return 'text-text-primary';
}

export const ResultsParameterGrid: React.FC<ResultsParameterGridProps> = ({
  results,
  flags,
  variant = 'inline',
  dense = false,
}) => {
  const flagStatusMap = useMemo(() => statusMapFromFlags(flags), [flags]);
  const entries = Object.entries(results ?? {});

  if (entries.length === 0) {
    return <p className={TYPE.meta}>No result values recorded.</p>;
  }

  if (variant === 'tiles') {
    return (
      <div className={RESULT_PANEL.grid}>
        {entries.map(([key, rawValue]) => {
          const { resultValue, unit, status } = parseResultEntry(key, rawValue, flagStatusMap);
          const statusLabel = resultStatusLabel(status);

          return (
            <div
              key={key}
              className={cn(RESULT_PANEL.tile, resultTileStatusClass(status, true))}
            >
              <div className="flex items-start justify-between gap-space-2 min-w-0">
                <span className={RESULT_PANEL.label} title={key}>{key}</span>
                {statusLabel && (
                  <span className={`${TYPE.caption} font-medium ${TONE.danger.fg} shrink-0`}>{statusLabel}</span>
                )}
              </div>
              <div className="flex items-baseline gap-space-0-5 min-w-0">
                <span className={cn(RESULT_PANEL.value, resultValueClass(status))}>
                  {resultValue}
                </span>
                {unit && <span className={RESULT_PANEL.unit}>{unit}</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (dense) {
    const maxVisible = LAB_CONFIG.COMPACT_RESULT_GRID_LIMIT;
    const visibleEntries = entries.slice(0, maxVisible);
    const remainingCount = entries.length - maxVisible;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-space-4 gap-y-space-0-5">
        {visibleEntries.map(([key, rawValue]) => {
          const { resultValue, unit, status } = parseResultEntry(key, rawValue, flagStatusMap);
          return (
            <div key={key} className="grid grid-cols-[1fr_auto] items-baseline gap-x-space-1-5 min-w-0">
              <span className={`${TYPE.caption} text-text-secondary truncate`} title={key}>{key}:</span>
              <span className={`${TYPE.caption} font-normal tabular-nums ${inlineValueClass(status)}`}>
                {resultValue}
                {unit && <span className={`text-text-tertiary font-normal ml-space-0-5 ${TYPE.caption}`}>{unit}</span>}
              </span>
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div className={`${TYPE.caption} col-span-full pt-space-0-5`}>
            +{remainingCount} more
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,max-content))] gap-x-space-6 gap-y-space-1">
      {entries.map(([key, rawValue]) => {
        const { resultValue, unit, status } = parseResultEntry(key, rawValue, flagStatusMap);
        return (
          <div
            key={key}
            className="grid grid-cols-[1fr_auto] items-baseline gap-x-space-2 whitespace-nowrap min-w-0"
          >
            <span className={`${TYPE.caption} text-text-secondary truncate text-right`} title={key}>
              {key}:
            </span>
            <span className={`${TYPE.value} font-normal tabular-nums ${inlineValueClass(status)}`}>
              {resultValue}
              {unit && <span className={`text-text-tertiary font-normal ml-space-1 ${TYPE.caption}`}>{unit}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
};
