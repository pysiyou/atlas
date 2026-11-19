/**
 * Catalog detail page for a single test code.
 * Uses BalancedColumnsLayout for automatic table arrangement.
 */

import { useParams } from 'react-router-dom';
import { useOrderableTest } from '../api/orderableTests';
import { useBreakpoint } from '@/hooks';
import { BalancedColumnsLayout } from '@/components/display';

import type { TableInput } from '@/components/display';
import { DetailPageShell, PageHeader } from '@/components/layout';
import { Panel } from '@/components/surfaces';
import { RecordId } from '@/features/shared';
import { formatRejectionCriteriaList } from '@/features/lab/cross';
import { getReferenceRangeDisplay } from '@/features/lab/entry/resultEntry';
import { SPACING, TABLE_TYPE } from '@/theme/recipes';
import { feedbackTitle } from '@/feedback';
import {
  capitalize,
  formatArrayWithFallback,
  formatBoolean,
  formatCurrency,
  formatDateTime,
  formatTurnaroundTime,
} from '@/utils';
import type { ReactNode } from 'react';
import type { OrderableTest, AnalyteDefinition } from '@/types';
import { resolveWorkupLabel } from '@/types/generated/workups';
import { useModuleListTitles } from '@/strings';
import {
  getTestClinicalCategory,
  getTestDescription,
  getTestOrderObsLabel,
} from '../utils/testDisplay';
import { getCategoryLabel } from '../constants/catalogConfig';

/** Visible row budget for scroll-capped catalog panels when balancing columns. */
const CATALOG_SCROLL_PANEL_BALANCE_ROWS = 12;

/** Column count for the catalog detail grid. */
function catalogDetailColumnCount(breakpoint: string): number {
  if (breakpoint === 'xs' || breakpoint === 'sm') return 1;
  if (breakpoint === 'md') return 2;
  return 3;
}

/**
 * Left-column identifier for a result component: analyte code and LOINC when present.
 */
function formatAnalyteRow(param: AnalyteDefinition): string {
  const loinc = param.loinc_code?.trim();
  if (loinc) return `${param.analyte_code} · ${loinc}`;
  return param.analyte_code;
}

/** Secondary line: reference range and critical limits when present. */
function formatAnalyteDetailsLine(param: AnalyteDefinition): string {
  const parts: string[] = [];
  const referenceRange = getReferenceRangeDisplay(param);
  if (referenceRange && referenceRange !== 'N/A') parts.push(`Ref: ${referenceRange}`);
  const crit = param.critical_range;
  if (crit?.low !== undefined || crit?.high !== undefined) {
    const low = crit.low !== undefined ? `<${crit.low}` : '';
    const high = crit.high !== undefined ? `>${crit.high}` : '';
    const sep = low && high ? ' / ' : '';
    parts.push(`Critical: ${low}${sep}${high}`);
  }
  return parts.length > 0 ? parts.join(' · ') : '—';
}

/**
 * Analyte row value: name (code) unit on the first line; ref / critical on the second.
 */
function formatAnalyteValue(param: AnalyteDefinition): ReactNode {
  const unit = param.unit?.trim();
  return (
    <div className={`flex flex-col ${SPACING.gapTight}`}>
      <div className="inline-flex flex-wrap items-baseline gap-x-space-1">
        <span>{param.name}</span>
        <span className="whitespace-nowrap">
          (
          <RecordId>{param.analyte_code}</RecordId>
          )
        </span>
        {unit ? <span>{unit}</span> : null}
      </div>
      <div className={TABLE_TYPE.meta}>{formatAnalyteDetailsLine(param)}</div>
    </div>
  );
}

/** Build the overview / sample / pricing / analyte tables for a catalog test. */
function buildCatalogDetailTables(test: OrderableTest): TableInput[] {
  const tables: TableInput[] = [
    {
      key: 'overview',
      preset: 'panel.pageEmbed.visible',
      title: 'Test Overview',
      rows: [
        { label: 'Test Code', value: <RecordId>{test.code}</RecordId> },
        { label: 'Test Name', value: test.name },
        { label: 'Category', value: getTestClinicalCategory(test) },
        {
          label: 'Catalog group',
          value: getCategoryLabel(test.category),
        },
        { label: 'Turnaround Time', value: formatTurnaroundTime(test.turnaroundTimeHours) },
        { label: 'Methodology', value: test.methodology || '-' },
        {
          label: 'LOINC role',
          value: getTestOrderObsLabel(test) ?? '—',
        },
        { label: 'LOINC Code', value: test.loincCode?.trim() || '-' },
        { label: 'Synonyms', value: formatArrayWithFallback(test.synonyms, '-') },
        { label: 'Description', value: getTestDescription(test) ?? '—' },
        {
          label: 'Included in profiles',
          value: formatArrayWithFallback(
            test.workups?.map(resolveWorkupLabel),
            '-'
          ),
        },
        { label: 'Notes', value: test.notes || '-' },
      ],
    },
    {
      key: 'sample',
      preset: 'panel.pageEmbed.visible',
      title: 'Sample Requirements',
      rows: [
        { label: 'Sample Type', value: capitalize(test.sampleType) },
        { label: 'Container', value: test.containerDescription || '-' },
        { label: 'Container Types', value: formatArrayWithFallback(test.containerTypes, '-') },
        { label: 'Container Colors', value: formatArrayWithFallback(test.containerTopColors, '-') },
        { label: 'Sample Volume', value: test.sampleVolume },
        {
          label: 'Min volume (mL)',
          value: test.minVolumeMl != null ? `${test.minVolumeMl} mL` : '-',
        },
        {
          label: 'Optimal volume (mL)',
          value: test.optimalVolumeMl != null ? `${test.optimalVolumeMl} mL` : '-',
        },
        { label: 'Fasting Required', value: formatBoolean(test.fastingRequired) },
        { label: 'Collection Notes', value: test.collectionNotes || '-' },
        { label: 'Special Requirements', value: test.specialRequirements || '-' },
        {
          label: 'Sample Rejection (Collection)',
          value: formatArrayWithFallback(formatRejectionCriteriaList(test.rejectionCriteria), 'Not defined'),
        },
        {
          label: 'Result Rejection (Validation)',
          value: formatArrayWithFallback(
            formatRejectionCriteriaList(test.validationRejectionCriteria),
            'Not defined',
          ),
        },
      ],
    },
    {
      key: 'pricing',
      preset: 'panel.pageEmbed.visible',
      title: 'Pricing & Status',
      rows: [
        { label: 'Price', value: formatCurrency(test.price) },
        { label: 'Status', value: test.isActive ? 'Active' : 'Inactive' },
        { label: 'Confidence Level', value: test.confidence || '-' },
        { label: 'Created', value: formatDateTime(test.createdAt) || '-' },
        { label: 'Last Updated', value: formatDateTime(test.updatedAt) || '-' },
      ],
    },
  ];

  if (test.analytes && test.analytes.length > 0) {
    tables.push({
      key: 'analytes',
      preset: 'panel.pageEmbed.scrollAuto.maxH',
      title: 'Result components',
      meta: String(test.analytes.length),
      balanceHeight: CATALOG_SCROLL_PANEL_BALANCE_ROWS,
      rows: test.analytes.map(analyte => ({
        label: formatAnalyteRow(analyte),
        value: formatAnalyteValue(analyte),
      })),
    });
  }

  return tables;
}

/**
 * Catalog detail page for a single test code.
 */
export function CatalogDetail() {
  const { testCode } = useParams<{ testCode: string }>();
  const breakpoint = useBreakpoint();
  const columnCount = catalogDetailColumnCount(breakpoint);
  const { test, isLoading, isError } = useOrderableTest(testCode);
  const titles = useModuleListTitles();
  const testLabel = titles.testDetail;

  if (isLoading) {
    return (
      <DetailPageShell header={<PageHeader title={testLabel} />} loading>
        <div
          className="grid gap-layout-section"
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columnCount * 2 }).map((_, index) => (
            <Panel
              key={index}
              preset="panel.pageEmbed.visible"
              title={titles.loading}
              loading
            />
          ))}
        </div>
      </DetailPageShell>
    );
  }

  if (isError || !test) {
    return (
      <DetailPageShell
        header={<PageHeader title={testLabel} />}
        notFound
        notFoundTitle={feedbackTitle('catalog.detail.notFoundTitle')}
        notFoundDescription={
          testCode != null
            ? `The test with code "${testCode}" could not be found in the catalog.`
            : feedbackTitle('catalog.detail.notFoundDescription')
        }
      >
        {null}
      </DetailPageShell>
    );
  }

  return (
    <DetailPageShell header={<PageHeader title={test.name} subtitle={test.code} />}>
      <BalancedColumnsLayout
        tables={buildCatalogDetailTables(test)}
        columns={columnCount}
        className={SPACING.pbScrollEnd}
      />
    </DetailPageShell>
  );
}