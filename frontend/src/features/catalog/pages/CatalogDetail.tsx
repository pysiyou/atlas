/**
 * Catalog detail page for a single test code.
 * Uses BalancedColumnsLayout for automatic table arrangement.
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { useTest } from '../api/tests';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { BalancedColumnsLayout } from '@/components/display';
import type { TableInput } from '@/components/display';
import { DetailPageShell, PageHeader } from '@/components/layout';
import { Panel } from '@/components/surfaces';
import { RecordId } from '@/features/shared';
import { formatRejectionCriteriaList } from '@/features/lab/cross';
import { SPACING } from '@/theme/recipes';
import { feedbackTitle } from '@/feedback';
import { formatCurrency, formatTurnaroundTime } from '@/utils';
import { formatDateTime } from '@/utils';
import { formatArrayWithFallback, formatBoolean, capitalize } from '@/utils';
import type { Test } from '@/types';

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
        { label: 'LOINC Codes', value: formatArrayWithFallback(test.loincCodes, '-') },
        { label: 'Panels', value: formatArrayWithFallback(test.panels, '-') },
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
      preset: 'panel.pageEmbed.visible',
      title: 'Result Parameters',
      meta: String(test.parameters.length),
      rows: test.parameters.map(param => ({
        label: param.code,
        value: `${param.name}${param.unit ? ` (${param.unit})` : ''}${param.referenceRange ? ` — ${param.referenceRange}` : ''}`,
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
export const CatalogDetail: React.FC = () => {
  const { testCode } = useParams<{ testCode: string }>();
  const breakpoint = useBreakpoint();
  const columnCount = catalogDetailColumnCount(breakpoint);
  const { test, isLoading, isError } = useTest(testCode);

  if (isLoading) {
    return (
      <DetailPageShell header={<PageHeader title="Test" />} loading>
        <div
          className="grid gap-layout-section"
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columnCount * 2 }).map((_, index) => (
            <Panel
              key={index}
              preset="panel.pageEmbed.visible"
              title="Loading"
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
        header={<PageHeader title="Test" />}
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
};
