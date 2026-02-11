/**
 * CatalogDetail Component
 *
 * Displays comprehensive details about a single test from the catalog.
 * Uses BalancedDetailsLayout for automatic table arrangement.
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { useTest } from '@/hooks/queries';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { BalancedDetailsLayout } from '@/shared/ui';
import type { TableInput } from '@/shared/ui';
import { DetailPageShell, DetailPageHeader, LoadingState } from '@/shared/components';
import { formatCurrency, formatTurnaroundTime } from '@/utils';
import { formatDetailDate } from '@/shared/utils/data';
import { formatArrayWithFallback, formatBooleanWithFallback, capitalize } from '../utils/catalog-formatters';

/**
 * CatalogDetail Component
 */
export const CatalogDetail: React.FC = () => {
  const { testCode } = useParams<{ testCode: string }>();
  const breakpoint = useBreakpoint();

  // Fetch test details using the query hook
  const { test, isLoading, isError } = useTest(testCode);

  /**
   * Calculate responsive column count based on screen size
   * - Mobile (xs, sm): 1 column
   * - Tablet (md): 2 columns
   * - Desktop (lg, xl, 2xl): 3 columns
   */
  const getColumnCount = (): number => {
    if (breakpoint === 'xs' || breakpoint === 'sm') {
      return 1;
    }
    if (breakpoint === 'md') {
      return 2;
    }
    // lg, xl, 2xl
    return 3;
  };

  // Show loading state
  if (isLoading) {
    return <LoadingState message="Loading test details..." fullScreen />;
  }

  // Error or not found: use shell for consistent padding and EmptyState
  if (isError || !test) {
    return (
      <DetailPageShell
        header={<DetailPageHeader title="Test" />}
        notFound
        notFoundTitle="Test Not Found"
        notFoundDescription={testCode != null ? `The test with code "${testCode}" could not be found in the catalog.` : undefined}
      >
        {null}
      </DetailPageShell>
    );
  }

  // Build tables for BalancedDetailsLayout
  const tables: TableInput[] = [
    {
      key: 'overview',
      title: 'Test Overview',
      rows: [
        { label: 'Test Code', value: <span className="text-brand font-mono">{test.code}</span> },
        { label: 'Test Name', value: test.name },
        { label: 'Category', value: capitalize(test.category) },
        { label: 'Turnaround Time', value: formatTurnaroundTime(test.turnaroundTime) },
        { label: 'Methodology', value: test.methodology || '-' },
        { label: 'Synonyms', value: formatArrayWithFallback(test.synonyms) },
        { label: 'LOINC Codes', value: formatArrayWithFallback(test.loincCodes) },
        { label: 'Panels', value: formatArrayWithFallback(test.panels) },
        { label: 'Notes', value: test.notes || '-' },
      ],
    },
    {
      key: 'sample',
      title: 'Sample Requirements',
      rows: [
        { label: 'Sample Type', value: capitalize(test.sampleType) },
        { label: 'Container', value: test.containerDescription || '-' },
        { label: 'Container Types', value: formatArrayWithFallback(test.containerTypes) },
        { label: 'Container Colors', value: formatArrayWithFallback(test.containerTopColors) },
        { label: 'Sample Volume', value: test.sampleVolume },
        { label: 'Minimum Volume', value: test.minimumVolume ? `${test.minimumVolume} mL` : '-' },
        { label: 'Fasting Required', value: formatBooleanWithFallback(test.fastingRequired) },
        { label: 'Collection Notes', value: test.collectionNotes || '-' },
        { label: 'Special Requirements', value: test.specialRequirements || '-' },
        { label: 'Rejection Criteria', value: formatArrayWithFallback(test.rejectionCriteria) },
      ],
    },
    {
      key: 'pricing',
      title: 'Pricing & Status',
      rows: [
        { label: 'Price', value: formatCurrency(test.price) },
        { label: 'Status', value: test.isActive ? 'Active' : 'Inactive' },
        { label: 'Confidence Level', value: test.confidence || '-' },
        { label: 'Created', value: formatDetailDate(test.createdAt) || '-' },
        { label: 'Last Updated', value: formatDetailDate(test.updatedAt) || '-' },
      ],
    },
  ];

  // Add parameters table if test has parameters
  if (test.parameters && test.parameters.length > 0) {
    tables.push({
      key: 'parameters',
      title: `Result Parameters (${test.parameters.length})`,
      rows: test.parameters.map(param => ({
        label: param.code,
        value: `${param.name}${param.unit ? ` (${param.unit})` : ''}${param.referenceRange ? ` — ${param.referenceRange}` : ''}`,
      })),
    });
  }

  // Add reference ranges table if available
  if (test.referenceRanges && test.referenceRanges.length > 0) {
    tables.push({
      key: 'ranges',
      title: `Reference Ranges (${test.referenceRanges.length})`,
      rows: test.referenceRanges.map((range, idx) => {
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
          label: `Range ${idx + 1}${genderStr}${ageStr}`,
          value: `${rangeStr}${criticalStr}`,
        };
      }),
    });
  }

  return (
    <DetailPageShell
      header={<DetailPageHeader title={test.name} subtitle={test.code} />}
    >
      <BalancedDetailsLayout tables={tables} columns={getColumnCount()} className="pb-6" />
    </DetailPageShell>
  );
};
