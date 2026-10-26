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
import { text, DATA_GRID, METRIC_TILE } from '@/theme/recipes';
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
export type ResultsGridLayout = 'grid' | 'table';

const COMPACT_RESULT_COLUMNS = 3;

function splitEntriesIntoColumns<T>(entries: T[], columnCount: number): T[][] {
  const columns: T[][] = Array.from({ length: columnCount }, () => []);
  entries.forEach((entry, index) => {
    columns[index % columnCount].push(entry);
  });
  return columns;
}

interface ResultsParameterGridProps {
  results: Record<string, unknown>;
  flags?: string[];
  testCode?: string;
  patient?: Patient | { gender?: Gender; age?: number; dateOfBirth?: string };
  variant?: ResultsGridVariant;
  /** `table`: parameter / result / reference interval; `grid`: multi-column label/value pairs. */
  layout?: ResultsGridLayout;
  /** Truncate grid after N parameters (validation queue mobile cards). */
  dense?: boolean;
}

export const ResultsParameterGrid: React.FC<ResultsParameterGridProps> = ({
  results,
  flags,
  testCode,
  patient,
  variant = 'inline',
  layout = 'table',
  dense = false,
}) => {
  const flagStatusMap = useMemo(() => statusMapFromFlags(flags), [flags]);
  const { test: catalogTest } = useTest(testCode);
  const parameterLabels = useMemo(
    () => buildParameterLabelMap(catalogTest),
    [catalogTest]
  );
  const catalogParameters = useMemo(
    () => (layout === 'table' ? catalogParametersFromTest(catalogTest) : {}),
    [layout, catalogTest]
  );
  const entries = Object.entries(results ?? {});
  const showStatus = layout === 'table';

  const referenceValueColumnCh = useMemo(() => {
    if (layout !== 'table' || variant !== 'inline') {
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
    return <Text role="body" intent="muted">No result values recorded.</Text>;
  }

  if (layout === 'table' && variant === 'inline') {
    return (
      <div className={DATA_GRID.scrollWrap}>
        <table className={DATA_GRID.table}>
          <colgroup>
            {DATA_GRID.colGroup.table.map(col => (
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

  const maxVisible = dense ? LAB_CONFIG.COMPACT_RESULT_GRID_LIMIT : entries.length;
  const visibleEntries = entries.slice(0, maxVisible);
  const remainingCount = entries.length - maxVisible;
  const compactColumns = splitEntriesIntoColumns(visibleEntries, COMPACT_RESULT_COLUMNS);

  return (
    <div className={METRIC_TILE.inlineDenseGrid}>
      {compactColumns.map((columnEntries, columnIndex) => (
        <div key={columnIndex} className={`${METRIC_TILE.inlineDenseColumnGrid} min-w-0`}>
            {columnEntries.flatMap(([key, rawValue]) => {
              const { resultValue, unit, status } = parseResultEntry(key, rawValue, flagStatusMap);
              const label = resolveParameterLabel(key, parameterLabels);
              const labelWithColon = `${label}:`;

              return [
                <Text
                  key={`${key}-label`}
                  role="label"
                  intent="default"
                  className="block min-w-0 max-w-full text-left font-medium leading-snug"
                  truncate
                  title={labelWithColon}
                >
                  {labelWithColon}
                </Text>,
                <div key={`${key}-value`} className={METRIC_TILE.inlineDenseValue}>
                  <ResultValueAnnotations
                    resultValue={resultValue}
                    unit={unit}
                    status={status}
                    dense={dense}
                    showStatus={showStatus}
                    truncate
                  />
                </div>,
              ];
            })}
        </div>
      ))}
      {remainingCount > 0 && (
        <p className={`${text({ role: 'caption' })} col-span-full`}>+{remainingCount} more</p>
      )}
    </div>
  );
};
