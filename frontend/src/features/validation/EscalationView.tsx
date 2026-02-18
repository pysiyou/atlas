/**
 * EscalationView - Dedicated tab for escalated tests (admin/labtech_plus only)
 *
 * Uses GET /results/pending-escalation for role-gated data. Click opens resolution modal
 * (Force Validate / Authorize Re-test / Final Reject).
 */

import React, { useMemo, useCallback } from 'react';
import { useInvalidateOrders } from '@/features/orders/utils/useOrderUtils';
import { usePendingEscalation } from '@/features/validation/api/usePendingEscalation';
import { EscalationCard } from './EscalationCard';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { LabWorkflowView, createLabItemFilter } from '@/features/lab/components/LabWorkflowView';
import { LabFilters } from '@/features/lab/components/LabFilters';
import { useLabWorkflowFilters } from '@/features/lab/hooks/useLabWorkflowFilters';
import { validationFilterConfig } from '@/features/lab/constants';
import { ErrorBoundary } from '@/components/feedback';
import { LabWorkflowViewSkeleton } from '@/features/lab/components/LabWorkflowViewSkeleton';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import type { PriorityLevel, TestWithContext } from '@/types';

export const EscalationView: React.FC = () => {
  const {
    escalatedTests: rawEscalated,
    isLoading,
    refetch,
    invalidatePendingEscalation,
  } = usePendingEscalation();
  const { invalidateAll: invalidateOrders } = useInvalidateOrders();
  const { openModal } = useModal();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');

  const escalatedTests = rawEscalated;

  const filterTest = useMemo(() => createLabItemFilter<TestWithContext>(), []);

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
  } = useLabWorkflowFilters<TestWithContext, PriorityLevel>({
    items: escalatedTests,
    getOrderDate: t => t.orderDate,
    getSampleType: t => t.sampleType,
    getStatus: t => t.priority as PriorityLevel,
    searchFilterFn: filterTest,
  });

  const openEscalationModal = useCallback(
    (test: TestWithContext) => {
      openModal(ModalType.ESCALATION_RESOLUTION_DETAIL, {
        test,
        onResolved: async () => {
          invalidatePendingEscalation();
          await invalidateOrders();
          await refetch();
        },
      });
    },
    [openModal, invalidatePendingEscalation, invalidateOrders, refetch]
  );

  if (isLoading) {
    return <LabWorkflowViewSkeleton />;
  }

  return (
    <ErrorBoundary>
      <LabWorkflowView
        items={filteredTests}
        renderCard={test => (
          <EscalationCard
            test={test}
            onClick={() => openEscalationModal(test)}
            isMobile={isMobile}
          />
        )}
        getItemKey={(test, idx) => `escalated-${test.orderId}-${test.testCode}-${idx}`}
        emptyIcon="shield-check"
        emptyTitle="No Escalated Tests"
        emptyDescription="There are no tests pending escalation resolution."
        filterRow={
          <LabFilters<PriorityLevel[]>
            config={validationFilterConfig}
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
