/**
 * Table layout for {@link LabResultGrid}: result / value / reference interval columns.
 */
import { Text } from '@/components/layout';
import { resolveAnalyteLabel } from '@/features/catalog';
import { DATA_GRID } from '@/theme/recipes';
import { useLabCopy } from '@/strings';
import type { AnalyteDefinition, Gender, Patient } from '@/types';
import { getAnalyteReferenceIntervalLines, parseResultEntry, type ResultStatus } from '../utils/labResult';
import { ReferenceIntervalCell } from './ReferenceIntervalCell';
import { ResultValueAnnotations } from './ResultValueAnnotations';

type LabResultInlineTableProps = {
  entries: [string, unknown][];
  analyteLabels: Record<string, string>;
  catalogAnalytes: Record<string, AnalyteDefinition | undefined>;
  flagStatusMap: Record<string, ResultStatus>;
  patient?: Patient | { gender?: Gender; age?: number; dateOfBirth?: string };
  referenceValueColumnCh: number;
  showStatus: boolean;
};

export function LabResultInlineTable({
  entries,
  analyteLabels,
  catalogAnalytes,
  flagStatusMap,
  patient,
  referenceValueColumnCh,
  showStatus,
}: LabResultInlineTableProps) {
  const labCopy = useLabCopy();

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
            <th scope="col" className={DATA_GRID.headerCell}>Result</th>
            <th scope="col" className={DATA_GRID.headerCell}>Value</th>
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
            const label = resolveAnalyteLabel(key, analyteLabels);
            const analyteDef = catalogAnalytes[key];
            const tooltipParts = [key];
            const loinc = analyteDef?.loinc_code?.trim();
            if (loinc) tooltipParts.push(loinc);
            const rowTitle = tooltipParts.join(' · ');
            const intervalLines = getAnalyteReferenceIntervalLines(
              analyteDef,
              referenceRange,
              patient
            );

            return (
              <tr key={key}>
                <td className={DATA_GRID.labelCell} title={rowTitle}>
                  <Text role="label" density="table" truncate title={rowTitle}>{label}</Text>
                </td>
                <td className={DATA_GRID.bodyCell}>
                  <ResultValueAnnotations
                    resultValue={resultValue}
                    unit={unit}
                    status={status}
                    showStatus={showStatus}
                  />
                </td>
                <td className={DATA_GRID.bodyCell} title={labCopy.actions.referenceInterval}>
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