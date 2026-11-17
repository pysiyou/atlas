/**
 * Catalog detail page for a single test code.
 * Uses BalancedColumnsLayout for automatic table arrangement.
 */

import { useParams } from 'react-router-dom';
import { useTest } from '../api/tests';
import { useBreakpoint } from '@/hooks';
import { BalancedColumnsLayout } from '@/components/display';

import type { TableInput } from '@/components/display';
import { DetailPageShell, PageHeader } from '@/components/layout';
import { Panel } from '@/components/surfaces';
import { RecordId } from '@/features/shared';
import { formatRejectionCriteriaList } from '@/features/lab/cross';
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
import type { Test, TestParameter } from '@/types';
import { resolveClinicalWorkupLabel } from '@/types/generated/clinicalWorkups';
import { useModuleListTitles } from '@/strings';

/** Visible row budget for scroll-capped catalog panels when balancing columns. */
const CATALOG_SCROLL_PANEL_BALANCE_ROWS = 12;

/** Column count for the catalog detail grid. */
function catalogDetailColumnCount(breakpoint: string): number {
  if (breakpoint === 'xs' || breakpoint === 'sm') return 1;
  if (breakpoint === 'md') return 2;
  return 3;
}

function formatReferenceRangeLine(
  range: Test['referenceRanges'][number],
  index: number,
): { label: string; value: string } {
  const rangeStr =
    range.text ||
    (range.min !== undefined && range.max !== undefined
      ? `${range.min} - ${range.max}`
      : range.min !== undefined
        ? `≥ ${range.min}`
        : range.max !== undefined
          ? `≤ ${range.max}`
          : 'N/A');

  const genderStr = range.gender ? ` (${capitalize(range.gender)})` : '';
  const ageStr =
    range.ageMin !== undefined || range.ageMax !== undefined
      ? ` [${range.ageMin ?? 0}-${range.ageMax ?? '∞'} yrs]`
      : '';
  const criticalStr =
    range.criticalLow !== undefined || range.criticalHigh !== undefined
      ? ` Critical: ${range.criticalLow !== undefined ? `<${range.criticalLow}` : ''}${range.criticalLow !== undefined && range.criticalHigh !== undefined ? ' / ' : ''}${range.criticalHigh !== undefined ? `>${range.criticalHigh}` : ''}`
      : '';

  return {
    label: `Range ${index + 1}${genderStr}${ageStr}`,
    value: `${rangeStr}${criticalStr}`,
  };
}

/**
 * Left-column identifier for a result parameter: observation LOINC, else mnemonic.
 */
function parameterRowLabel(param: TestParameter): string {
  const loinc = param.loincCode?.trim();
  return loinc && loinc.length > 0 ? loinc : param.code;
}

/** Secondary line: reference range and critical limits when present. */
function formatParameterDetailsLine(param: TestParameter): string {
  const parts: string[] = [];
  const referenceRange = param.referenceRange?.trim();
  if (referenceRange) parts.push(`Ref: ${referenceRange}`);
  if (param.criticalLow !== undefined || param.criticalHigh !== undefined) {
    const low = param.criticalLow !== undefined ? `<${param.criticalLow}` : '';
    const high = param.criticalHigh !== undefined ? `>${param.criticalHigh}` : '';
    const sep = low && high ? ' / ' : '';
    parts.push(`Critical: ${low}${sep}${high}`);
  }
  return parts.length > 0 ? parts.join(' · ') : '—';
}

/**
 * Uniform parameter value: name (code) unit on the first line; ref / critical on the second.
 */
function formatParameterValue(param: TestParameter): ReactNode {
  const unit = param.unit?.trim();
  return (
    <div className={`flex flex-col ${SPACING.gapTight}`}>
      <div className="inline-flex flex-wrap items-baseline gap-x-space-1">
        <span>{param.name}</span>
        <span className="whitespace-nowrap">
          (
          <RecordId>{param.code}</RecordId>
          )
        </span>
        {unit ? <span>{unit}</span> : null}
      </div>
      <div className={TABLE_TYPE.meta}>{formatParameterDetailsLine(param)}</div>
    </div>
  );
}

/** Build the overview / sample / pricing / parameter tables for a catalog test. */
function buildCatalogDetailTables(test: Test): TableInput[] {
  const tables: TableInput[] = [
    {
      key: 'overview',
      preset: 'panel.pageEmbed.visible',
      title: 'Test Overview',
      rows: [
        { label: 'Test Code', value: <RecordId>{test.code}</RecordId> },
        { label: 'Test Name', value: test.name },
        { label: 'Category', value: capitalize(test.category) },
        { label: 'Turnaround Time', value: formatTurnaroundTime(test.turnaroundTime) },
        { label: 'Methodology', value: test.methodology || '-' },
        { label: 'Synonyms', value: formatArrayWithFallback(test.synonyms, '-') },
        { label: 'LOINC Code', value: test.loincCode?.trim() || '-' },
        {
          label: 'Clinical Workups',
          value: formatArrayWithFallback(
            test.workups?.map(resolveClinicalWorkupLabel),
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
        { label: 'Minimum Volume', value: test.minimumVolume ? `${test.minimumVolume} mL` : '-' },
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

  if (test.parameters && test.parameters.length > 0) {
    tables.push({
      key: 'parameters',
      preset: 'panel.pageEmbed.scrollAuto.maxH',
      title: 'Result Parameters',
      meta: String(test.parameters.length),
      balanceHeight: CATALOG_SCROLL_PANEL_BALANCE_ROWS,
      rows: test.parameters.map(param => ({
        label: parameterRowLabel(param),
        value: formatParameterValue(param),
      })),
    });
  }

  if (test.referenceRanges && test.referenceRanges.length > 0) {
    tables.push({
      key: 'ranges',
      preset: 'panel.pageEmbed.visible',
      title: 'Reference Ranges',
      meta: String(test.referenceRanges.length),
      rows: test.referenceRanges.map(formatReferenceRangeLine),
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
  const { test, isLoading, isError } = useTest(testCode);
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
