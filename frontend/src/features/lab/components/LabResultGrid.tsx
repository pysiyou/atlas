/**
 * Read-only analyte result display — inline (validation card) or tile (entry) layouts.
 */
import { useMemo } from 'react';
import {
  getAnalyteReferenceIntervalLines,
  parseResultEntry,
  statusMapFromFlags,
} from '../utils/labResult';
import { LabResultInlineTable } from './LabResultInlineTable';
import { LAB_CONFIG } from '../constants';
import { text, METRIC_TILE } from '@/theme/recipes';
import { resultTileStatusClass } from '../utils/labResult';
import { Text } from '@/components/layout';
import {
  buildAnalyteLabelMap,
  getTestAnalytes,
  resolveAnalyteLabel,
  useOrderableTest,
} from '@/features/catalog';
import { ResultValueAnnotations } from './ResultValueAnnotations';
import type { Gender, Patient } from '@/types';

export type ResultsGridVariant = 'inline' | 'tiles';
export type ResultsGridLayout = 'grid' | 'table';

interface LabResultGridProps {
  results: Record<string, unknown>;
  flags?: string[];
  testCode?: string;
  patient?: Patient | { gender?: Gender; age?: number; dateOfBirth?: string };
  variant?: ResultsGridVariant;
  /** `table`: result / value / reference interval; `grid`: wrapped label/value list. */
  layout?: ResultsGridLayout;
  /** Truncate grid after N analytes (validation queue mobile cards). */
  dense?: boolean;
}

export function LabResultGrid({
  results,
  flags,
  testCode,
  patient,
  variant = 'inline',
  layout = 'table',
  dense = false,
}: LabResultGridProps) {
  const flagStatusMap = useMemo(() => statusMapFromFlags(flags), [flags]);
  const { test: catalogTest } = useOrderableTest(testCode);
  const analyteLabels = useMemo(
    () => buildAnalyteLabelMap(catalogTest),
    [catalogTest]
  );
  const catalogAnalytes = useMemo(
    () => (layout === 'table' ? getTestAnalytes(catalogTest) : {}),
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
      const lines = getAnalyteReferenceIntervalLines(
        catalogAnalytes[key],
        referenceRange,
        patient
      );
      for (const line of lines) {
        maxLen = Math.max(maxLen, line.value.length);
      }
    }
    return Math.max(maxLen, 4);
  }, [layout, variant, entries, catalogAnalytes, patient, flagStatusMap]);

  if (entries.length === 0) {
    return <Text role="body" intent="muted">No result values recorded.</Text>;
  }

  if (layout === 'table' && variant === 'inline') {
    return (
      <LabResultInlineTable
        entries={entries}
        analyteLabels={analyteLabels}
        catalogAnalytes={catalogAnalytes}
        flagStatusMap={flagStatusMap}
        patient={patient}
        referenceValueColumnCh={referenceValueColumnCh}
        showStatus={showStatus}
      />
    );
  }

  if (variant === 'tiles') {
    return (
      <div className={METRIC_TILE.grid}>
        {entries.map(([key, rawValue]) => {
          const { resultValue, unit, status } = parseResultEntry(key, rawValue, flagStatusMap);
          const label = resolveAnalyteLabel(key, analyteLabels);

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

  return (
    <div className={dense ? METRIC_TILE.inlineResultListDense : METRIC_TILE.inlineResultList}>
      {visibleEntries.map(([key, rawValue]) => {
        const { resultValue, unit, status } = parseResultEntry(key, rawValue, flagStatusMap);
        const label = resolveAnalyteLabel(key, analyteLabels);
        const labelWithColon = `${label}:`;

        return (
          <div
            key={key}
            className={dense ? METRIC_TILE.inlineRowDense : METRIC_TILE.inlineRow}
          >
            <Text
              role="label"
              intent="default"
              className="shrink-0 font-medium leading-snug"
              title={labelWithColon}
            >
              {labelWithColon}
            </Text>
            <div className={METRIC_TILE.inlineDenseValue}>
              <ResultValueAnnotations
                resultValue={resultValue}
                unit={unit}
                status={status}
                dense={dense}
                showStatus={showStatus}
                truncate
              />
            </div>
          </div>
        );
      })}
      {remainingCount > 0 && (
        <p className={text({ role: 'caption' })}>+{remainingCount} more</p>
      )}
    </div>
  );
}
