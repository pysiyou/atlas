/**
 * Read-only parameter display — inline (validation card) or tile (entry) layouts.
 */
import React, { useMemo } from 'react';
import {
  getParameterReferenceIntervalLines,
  parseResultEntry,
  statusMapFromFlags,
} from '../utils/labResult';
import { ReferenceIntervalCell } from './ReferenceIntervalCell';
import { LAB_CONFIG } from '../constants';
import { DATA_GRID, METRIC_TILE, TYPE } from '@/theme/recipes';
import { resultTileStatusClass } from '../utils/labResult';
import { Text } from '@/components/layout';
import {
  buildParameterLabelMap,
  catalogParametersFromTest,
  resolveParameterLabel,
  useTest,
} from '@/features/catalog';
import { ResultValueAnnotations } from './ResultValueAnnotations';
import type { Gender, Patient } from '@/types';

export type ResultsGridVariant = 'inline' | 'tiles';
export type ResultsGridLayout = 'compact' | 'validation';

interface ResultsParameterGridProps {
  results: Record<string, unknown>;
  flags?: string[];
  testCode?: string;
  patient?: Patient | { gender?: Gender; age?: number; dateOfBirth?: string };
  variant?: ResultsGridVariant;
  /** Validation: label, value, reference interval columns. */
  layout?: ResultsGridLayout;
  /** Card-style 4-column cap (validation card mobile). */
  dense?: boolean;
}

export const ResultsParameterGrid: React.FC<ResultsParameterGridProps> = ({
  results,
  flags,
  testCode,
  patient,
  variant = 'inline',
  layout = 'compact',
  dense = false,
}) => {
  const flagStatusMap = useMemo(() => statusMapFromFlags(flags), [flags]);
  const { test: catalogTest } = useTest(testCode);
  const parameterLabels = useMemo(
    () => buildParameterLabelMap(catalogTest),
    [catalogTest]
  );
  const catalogParameters = useMemo(
    () => (layout === 'validation' ? catalogParametersFromTest(catalogTest) : {}),
    [layout, catalogTest]
  );
  const entries = Object.entries(results ?? {});
  const showStatus = layout === 'validation';

  const referenceValueColumnCh = useMemo(() => {
    if (layout !== 'validation' || variant !== 'inline') {
      return 4;
    }
    let maxLen = 0;
    for (const [key, rawValue] of entries) {
      const { referenceRange } = parseResultEntry(key, rawValue, flagStatusMap);
      const lines = getParameterReferenceIntervalLines(
        catalogParameters[key],
        referenceRange,
        patient
      );
      for (const line of lines) {
        maxLen = Math.max(maxLen, line.value.length);
      }
    }
    return Math.max(maxLen, 4);
  }, [layout, variant, entries, catalogParameters, patient, flagStatusMap]);

  if (entries.length === 0) {
    return <Text role="meta">No result values recorded.</Text>;
  }

  if (layout === 'validation' && variant === 'inline') {
    return (
      <div className={DATA_GRID.scrollWrap}>
        <table className={DATA_GRID.table}>
          <colgroup>
            {DATA_GRID.colGroup.validation.map(col => (
              <col key={col} className={col} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className={DATA_GRID.headerCell}>Parameter</th>
              <th scope="col" className={DATA_GRID.headerCell}>Result</th>
              <th scope="col" className={DATA_GRID.headerCell}>Reference interval</th>
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
              const intervalLines = getParameterReferenceIntervalLines(
                catalogParameters[key],
                referenceRange,
                patient
              );

              return (
                <tr key={key}>
                  <td className={DATA_GRID.labelCell} title={label}>
                    <Text role="label" density="table" truncate title={label}>{label}</Text>
                  </td>
                  <td className={DATA_GRID.bodyCell}>
                    <ResultValueAnnotations
                      resultValue={resultValue}
                      unit={unit}
                      status={status}
                      showStatus={showStatus}
                    />
                  </td>
                  <td className={DATA_GRID.bodyCell} title="Reference interval">
                    <ReferenceIntervalCell
                      lines={intervalLines}
                      valueColumnCh={referenceValueColumnCh}
                    />
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
      <div className={METRIC_TILE.grid}>
        {entries.map(([key, rawValue]) => {
          const { resultValue, unit, status } = parseResultEntry(key, rawValue, flagStatusMap);
          const label = resolveParameterLabel(key, parameterLabels);

          return (
            <div
              key={key}
              className={resultTileStatusClass(status, true)}
            >
              <span className={METRIC_TILE.label} title={label}>{label}</span>
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
      <div className={METRIC_TILE.inlineDenseGrid}>
        {visibleEntries.map(([key, rawValue]) => {
          const { resultValue, unit, status } = parseResultEntry(key, rawValue, flagStatusMap);
          const label = resolveParameterLabel(key, parameterLabels);
          return (
            <div key={key} className={METRIC_TILE.inlineRowDense}>
              <Text role="caption" className="text-text-secondary truncate" title={label}>
                {label}:
              </Text>
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
    <div className={METRIC_TILE.inlineGrid}>
      {entries.map(([key, rawValue]) => {
        const { resultValue, unit, status } = parseResultEntry(key, rawValue, flagStatusMap);
        const label = resolveParameterLabel(key, parameterLabels);
        return (
          <div key={key} className={METRIC_TILE.inlineRow}>
            <Text role="caption" className="text-text-secondary truncate" title={label}>
              {label}:
            </Text>
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
