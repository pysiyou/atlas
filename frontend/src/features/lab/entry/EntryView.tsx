/**
 * EntryView - Main view for result entry workflow
 *
 * Refactored to use useLabDataProvider and createWorkflowFilters.
 */

import React from 'react';
import { useTestNameLookup } from '@/features/catalog';
import { useLabDataProvider, createWorkflowFilters } from '@/features/lab/hooks';
import type { TestWithContextResult } from '@/features/lab/hooks/useLabTestsFromOrders';
import { EntryCard } from './EntryCard/index';
import { LabWorkflowView } from '../components/LabWorkflowView';
import { LabFilters } from '../components/LabFilters';
import { entryFilterConfig } from '../constants';
import { ErrorBoundary } from '@/components';
import { DetailPageSkeleton } from '@/components/loaders/DetailPageSkeleton';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { useEntryWorkflow } from './useEntryWorkflow';
import { orderTestKey } from '../utils/orderTestKey';

export const EntryView: React.FC = () => {
  const { getTest } = useTestNameLookup();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');

  // Use shared data provider
  const { entryTests: allTests, tests: testCatalog, orders, isLoading } = useLabDataProvider();

  const {
    results,
    technicianNotes,
    handleResultChange,
    handleNotesChange,
    areAllParametersFilled,
    handleSaveResults,
    openTestModal,
  } = useEntryWorkflow({ allTests, testCatalog, orders });

  // Use filter factory
  const {
    filteredItems: filteredTests,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    sampleTypeFilters,
    setSampleTypeFilters,
    statusFilters,
    setStatusFilters,
  } = createWorkflowFilters({
    items: allTests,
    workflowType: 'entry',
  });

  const hasNoItems = allTests.length === 0;
  if ((isLoading && hasNoItems) || !orders || !testCatalog) {
    return (
      <ErrorBoundary>
        <DetailPageSkeleton variant="workflow-grid" />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <LabWorkflowView
        items={filteredTests}
        renderCard={(test, idx, _filtered) => {
          const testItem = test as TestWithContextResult;
          if (testItem.id == null) return null;
          const testDef = getTest(testItem.testCode);
          const resultKey = orderTestKey(testItem.id);
          const isComplete = testDef?.parameters
            ? areAllParametersFilled(resultKey, testDef.parameters.length)
            : false;

          const cardProps = {
            test: testItem,
            testDef,
            resultKey,
            results: results[resultKey] || {},
            technicianNotes: technicianNotes[resultKey] || '',
            isComplete,
            onResultsChange: handleResultChange,
            onNotesChange: handleNotesChange,
            onSave: () => handleSaveResults(testItem.id!, testItem.orderId, allTests, testCatalog),
            onClick: () => openTestModal(testItem, _filtered as TestWithContextResult[]),
          };

          return (
            <EntryCard
              key={`entry-${testItem.id}-${idx}`}
              {...cardProps}
              isMobile={isMobile}
            />
          );
        }}
        getItemKey={(test, idx) => ((test as TestWithContextResult).id != null ? `entry-${(test as TestWithContextResult).id}-${idx}` : `entry-${idx}`)}
        emptyIcon="checklist"
        emptyTitle="No Pending Results"
        emptyDescription="There are no samples waiting for result entry."
        filterRow={
          <LabFilters
            config={entryFilterConfig}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            sampleTypeFilters={sampleTypeFilters}
            onSampleTypeFiltersChange={setSampleTypeFilters}
            statusFilters={statusFilters}
            onStatusFiltersChange={setStatusFilters}
          />
        }
      />
    </ErrorBoundary>
  );
};
