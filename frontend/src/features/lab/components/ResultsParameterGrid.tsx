/**
 * Read-only parameter display — inline (validation card) or tile (entry) layouts.
 */
import React, { useMemo } from 'react';
import { parseResultEntry, statusMapFromFlags } from '../utils/labResult';
import { LAB_CONFIG } from '../constants';
import { TYPE } from '@/components/theme/recipes';
import { RESULT_PANEL, resultTileStatusClass } from '../utils/labResult';
import {
  catalogParameterReferenceRanges,
  resolveParameterLabel,
  useParameterLabelMap,
  useTestCatalog,
} from '@/features/catalog';
import { ResultValueAnnotations } from './ResultValueAnnotations';

export type ResultsGridVariant = 'inline' | 'tiles';
export type ResultsGridLayout = 'compact' | 'validation';

interface ResultsParameterGridProps {
  results: Record<string, unknown>;
  flags?: string[];
  testCode?: string;
  variant?: ResultsGridVariant;
  /** Validation: label, value, reference interval columns. */
  layout?: ResultsGridLayout;
  /** Card-style 4-column cap (validation card mobile). */
  dense?: boolean;
}

function resolveReferenceInterval(
  code: string,
  fromResult: string,
  catalogRanges: Record<string, string>
): string {
  if (fromResult) return fromResult;
  return catalogRanges[code] || '—';
}

export const ResultsParameterGrid: React.FC<ResultsParameterGridProps> = ({
  results,
  flags,
  testCode,
  variant = 'inline',
  layout = 'compact',
  dense = false,
}) => {
  const flagStatusMap = useMemo(() => statusMapFromFlags(flags), [flags]);
  const parameterLabels = useParameterLabelMap(testCode);
  const { tests } = useTestCatalog();
  const catalogRanges = useMemo(
    () =>
      layout === 'validation' && testCode ? catalogParameterReferenceRanges(testCode, tests) : {},
    [layout, testCode, tests]
  );
  const entries = Object.entries(results ?? {});
  const showStatus = layout === 'validation';

  if (entries.length === 0) {
    return <p className={TYPE.meta}>No result values recorded.</p>;
  }

  if (layout === 'validation' && variant === 'inline') {
    const headerClass = `${TYPE.caption} text-text-tertiary uppercase tracking-wide font-normal text-left`;
    const cellClass = 'py-space-2 pr-space-4 align-top text-left last:pr-0';

    return (
      <div className="overflow-x-auto min-w-0">
        <table className="w-full min-w-[20rem] table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[40%]" />
            <col className="w-[35%]" />
            <col className="w-[25%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border-subtle">
              <th scope="col" className={`${headerClass} pb-space-2 ${cellClass}`}>Parameter</th>
              <th scope="col" className={`${headerClass} pb-space-2 ${cellClass}`}>Result</th>
              <th scope="col" className={`${headerClass} pb-space-2 ${cellClass}`}>
                Reference interval
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, rawValue]) => {
              const { resultValue, unit, referenceRange, status } = parseResultEntry(
                key,
                rawValue,
                flagStatusMap
              );
              const label = resolveParameterLabel(key, parameterLabels);
              const interval = resolveReferenceInterval(key, referenceRange, catalogRanges);

              return (
                <tr key={key} className="border-b border-border-subtle last:border-0">
                  <td className={`${TYPE.label} text-text-secondary ${cellClass}`} title={label}>
                    {label}
                  </td>
                  <td className={cellClass}>
                    <ResultValueAnnotations
                      resultValue={resultValue}
                      unit={unit}
                      status={status}
                      showStatus={showStatus}
                    />
                  </td>
                  <td
                    className={`${TYPE.caption} text-text-tertiary tabular-nums ${cellClass}`}
                    title="Reference interval"
                  >
                    {interval}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (variant === 'tiles') {
    return (
      <div className={RESULT_PANEL.grid}>
        {entries.map(([key, rawValue]) => {
          const { resultValue, unit, status } = parseResultEntry(key, rawValue, flagStatusMap);
          const label = resolveParameterLabel(key, parameterLabels);

          return (
            <div
              key={key}
              className={`${RESULT_PANEL.tile} ${resultTileStatusClass(status, true)}`}
            >
              <span className={RESULT_PANEL.label} title={label}>{label}</span>
              <ResultValueAnnotations resultValue={resultValue} unit={unit} status={status} tile />
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
          const label = resolveParameterLabel(key, parameterLabels);
          return (
            <div key={key} className="flex flex-wrap items-baseline gap-x-space-1-5 min-w-0 text-left">
              <span className={`${TYPE.caption} text-text-secondary truncate`} title={label}>{label}:</span>
              <ResultValueAnnotations
                resultValue={resultValue}
                unit={unit}
                status={status}
                dense
                showStatus={showStatus}
              />
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
        const label = resolveParameterLabel(key, parameterLabels);
        return (
          <div
            key={key}
            className="flex flex-wrap items-baseline gap-x-space-2 min-w-0 text-left"
          >
            <span className={`${TYPE.caption} text-text-secondary truncate`} title={label}>
              {label}:
            </span>
            <ResultValueAnnotations
              resultValue={resultValue}
              unit={unit}
              status={status}
              showStatus={showStatus}
            />
          </div>
        );
      })}
    </div>
  );
};
