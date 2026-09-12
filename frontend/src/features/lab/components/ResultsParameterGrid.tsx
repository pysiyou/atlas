/**
 * Read-only parameter display — inline (validation card) or tile (entry) layouts.
 */
import React, { useMemo } from 'react';
import { cn } from '@/utils';
import { parseResultEntry, statusMapFromFlags, isCritical } from '../utils/labHelpers';
import { LAB_CONFIG } from '@/features/lab/constants';
import {
  RESULT_PANEL,
  resultTileStatusClass,
  resultValueClass,
  resultStatusLabel,
} from './resultDisplayStyles';

export type ResultsGridVariant = 'inline' | 'tiles';

interface ResultsParameterGridProps {
  results: Record<string, unknown>;
  flags?: string[];
  variant?: ResultsGridVariant;
  /** Card-style 4-column cap (validation card mobile). */
  dense?: boolean;
}

function inlineValueClass(status: ReturnType<typeof parseResultEntry>['status']): string {
  if (isCritical(status)) return 'text-danger-fg';
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
    return <p className="text-sm text-text-tertiary">No result values recorded.</p>;
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
              <div className="flex items-start justify-between gap-2 min-w-0">
                <span className={RESULT_PANEL.label} title={key}>{key}</span>
                {statusLabel && (
                  <span className="text-xxs font-medium text-danger-fg shrink-0">{statusLabel}</span>
                )}
              </div>
              <div className="flex items-baseline gap-0.5 min-w-0">
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5">
        {visibleEntries.map(([key, rawValue]) => {
          const { resultValue, unit, status } = parseResultEntry(key, rawValue, flagStatusMap);
          return (
            <div key={key} className="grid grid-cols-[1fr_auto] items-baseline gap-x-1.5 min-w-0">
              <span className="text-xxs text-text-tertiary truncate" title={key}>{key}:</span>
              <span className={`text-xxs font-normal tabular-nums ${inlineValueClass(status)}`}>
                {resultValue}
                {unit && <span className="text-text-tertiary font-normal ml-0.5 text-[9px]">{unit}</span>}
              </span>
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div className="text-xxs text-text-tertiary col-span-full pt-0.5">
            +{remainingCount} more
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,max-content))] gap-x-6 gap-y-1">
      {entries.map(([key, rawValue]) => {
        const { resultValue, unit, status } = parseResultEntry(key, rawValue, flagStatusMap);
        return (
          <div
            key={key}
            className="grid grid-cols-[1fr_auto] items-baseline gap-x-2 whitespace-nowrap min-w-0"
          >
            <span className="text-xxs text-text-tertiary truncate text-right" title={key}>
              {key}:
            </span>
            <span className={`text-xs font-normal tabular-nums ${inlineValueClass(status)}`}>
              {resultValue}
              {unit && <span className="text-text-tertiary font-normal ml-1 text-xxs">{unit}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
};
