/**
 * EscalationView - Dedicated tab for escalated tests (admin/labtech_plus only)
 *
 * Uses GET /results/pending-escalation for role-gated data. Click opens resolution modal
 * (Force Validate / Authorize Re-test / Final Reject).
 */

import React, { useState, useMemo, useCallback } from 'react';
import { usePendingEscalation, useInvalidateOrders } from '@/hooks/queries';
import { EscalationCard } from './EscalationCard';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import { LabWorkflowView, createLabItemFilter } from '../components/LabWorkflowView';
import { DataErrorBoundary } from '@/shared/components';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import type { PriorityLevel, TestWithContext } from '@/types';
import { ValidationFilters } from './ValidationFilters';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [sampleTypeFilters, setSampleTypeFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<PriorityLevel[]>([]);

  const escalatedTests: (TestWithContext & { hasCriticalValues?: boolean })[] = rawEscalated as unknown as (TestWithContext & { hasCriticalValues?: boolean })[];

  const filterTest = useMemo(() => createLabItemFilter<TestWithContext>(), []);

  const filteredTests = useMemo(() => {
    let out = escalatedTests;
    if (dateRange) {
      const [start, end] = dateRange;
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      out = out.filter(t => {
        const d = (t as { orderDate?: string }).orderDate;
        if (!d) return false;
        const orderDate = new Date(d);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }
    if (sampleTypeFilters.length > 0) {
      out = out.filter(
        t => t.sampleType && sampleTypeFilters.includes(t.sampleType)
      );
    }
    if (statusFilters.length > 0) {
      out = out.filter(
        t => t.priority && statusFilters.includes(t.priority as PriorityLevel)
      );
    }
    if (searchQuery.trim()) {
      out = out.filter(t => filterTest(t, searchQuery));
    }
    return out;
  }, [escalatedTests, dateRange, sampleTypeFilters, statusFilters, searchQuery, filterTest]);

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
    return <div>Loading...</div>;
  }

  return (
    <DataErrorBoundary>
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
          <ValidationFilters
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
    </DataErrorBoundary>
  );
};
