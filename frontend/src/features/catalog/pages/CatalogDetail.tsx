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
import { EmptyState, BalancedDetailsLayout } from '@/shared/ui';
import { LoadingState } from '@/shared/components';
import { formatCurrency, formatTurnaroundTime } from '@/utils';
import type { TableInput } from '@/shared/ui/BalancedDetailsLayout';
import { formatArray, formatBoolean, formatDetailDate } from '@/shared/utils/data';
import { ICONS } from '@/utils/icon-mappings';

/**
 * Format array to comma-separated string with fallback
 */
const formatArrayWithFallback = (arr: string[] | undefined): string => {
  const formatted = formatArray(arr);
  return formatted || '-';
};

/**
 * Format boolean to Yes/No with fallback
 */
const formatBooleanWithFallback = (val: boolean | undefined): string => {
  if (val === undefined) return '-';
  return formatBoolean(val);
};

/**
 * Capitalize first letter
 */
const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

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

  // Show error or not found state
  if (isError || !test) {
    return (
      <div className="h-full flex flex-col p-6">
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={ICONS.actions.alertCircle}
            title="Test Not Found"
            description={`The test with code "${testCode}" could not be found in the catalog.`}
          />
        </div>
      </div>
    );
  }

  // Build tables for BalancedDetailsLayout
  const tables: TableInput[] = [
    {
      key: 'overview',
      title: 'Test Overview',
      rows: [
        { label: 'Test Code', value: test.code },
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
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-sm font-medium text-gray-900">{test.name}</h1>
            <p className="text-xs text-gray-500 font-mono">{test.code}</p>
          </div>
        </div>
      </div>

      {/* Main Content - Balanced Layout */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <BalancedDetailsLayout tables={tables} columns={getColumnCount()} className="pb-6" />
      </div>
    </div>
  );
};
