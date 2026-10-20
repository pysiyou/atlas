/**
 * ReportList Component - Migrated to use ListView
 *
 * Displays a list of reportable orders ready for report generation.
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTestCatalog } from '@/features/catalog';
import { useUserLookup } from '@/lib/api/users';
import { createSampleLookupForOrder } from '@/features/lab';
import { reportsAPI, useReportableOrders } from '../api/reports';
import { useClientListFilter } from '@/hooks/useClientListFilter';
import { ListView } from '@/components/surfaces';
import { DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL } from '@/components/data-table';
import { createReportTableConfig } from '../config/ReportTable.config';
import { ReportFilters } from '../components/ReportFilters';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import { generateLabReport, downloadPDF, getDefaultTemplate } from '../utils/reportPDF';
import type { ReportableOrder } from '../types';
import {
  filterReportableOrdersByDateRange,
  getActiveOrderTests,
  prepareReportData,
  downloadLabReport,
} from '../utils/prepareReportData';
import { formatDate } from '@/utils';
import { notify, errorAlertMessage } from '@/utils/feedback';

/** Parse `/reports/:id` so a deep link can open preview without unmounting the list. */
function parseReportOrderId(id: string | undefined): number | null {
  if (!id) return null;
  const orderId = Number.parseInt(id, 10);
  return Number.isFinite(orderId) ? orderId : null;
}

/** Stable search extractor — identity must not change per ReportList render. */
function reportSearchFields(order: ReportableOrder): string[] {
  return [
    String(order.orderId),
    String(order.patientId),
    order.patientName,
    ...getActiveOrderTests(order.order).flatMap(test => [test.testCode, test.testName]),
  ];
}

export const ReportList: React.FC = () => {
  const navigate = useNavigate();
  const { id: routeOrderId } = useParams<{ id?: string }>();
  const deepLinkOrderId = parseReportOrderId(routeOrderId);
  const openedDeepLinkIdRef = useRef<number | null>(null);

  const {
    reportableOrders,
    isLoading: reportsLoading,
    isError,
    error: queryError,
    refetch,
  } = useReportableOrders();
  const { tests, isLoading: testsLoading } = useTestCatalog();
  const { getUserName, isLoading: usersLoading } = useUserLookup();

  const loading = reportsLoading || testsLoading || usersLoading;

  const error = isError
    ? {
        message: errorAlertMessage('reports.list.loadFailed', queryError),
        operation: 'load' as const,
      }
    : null;

  const { openModal } = useModal();
  const [generatingOrderId, setGeneratingOrderId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);

  const {
    filteredItems: preFilteredOrders,
    searchQuery,
    setSearchQuery,
  } = useClientListFilter<ReportableOrder, never>(reportableOrders, {
    searchFields: reportSearchFields,
    defaultSort: undefined,
  });

  const filteredOrders = useMemo(
    () => filterReportableOrdersByDateRange(preFilteredOrders, dateRange),
    [preFilteredOrders, dateRange]
  );

  const buildReportData = useCallback(
    async (reportableOrder: ReportableOrder) => {
      const getSample = await createSampleLookupForOrder(reportableOrder.orderId);
      return prepareReportData({
        reportableOrder,
        patients: undefined,
        catalogTests: tests,
        getSample,
        getUserName: id => getUserName(id),
      });
    },
    [tests, getUserName]
  );

  const handlePreview = useCallback(
    (reportableOrder: ReportableOrder) => {
      openModal({ type: ModalType.REPORT_PREVIEW, orderId: reportableOrder.orderId });
    },
    [openModal]
  );

  /**
   * Direct visits to `/reports/:id` open the same overlay as a row click
   * so the table stays mounted behind the modal.
   */
  useEffect(() => {
    if (deepLinkOrderId == null) return;
    if (openedDeepLinkIdRef.current === deepLinkOrderId) return;
    openedDeepLinkIdRef.current = deepLinkOrderId;
    openModal({ type: ModalType.REPORT_PREVIEW, orderId: deepLinkOrderId });
  }, [deepLinkOrderId, openModal]);

  const handlePrint = useCallback(
    async (reportableOrder: ReportableOrder) => {
      try {
        setGeneratingOrderId(reportableOrder.orderId);
        const reportData = await buildReportData(reportableOrder);
        await reportsAPI.recordOrderReportDownload(reportableOrder.orderId);
        await downloadLabReport(
          reportableOrder,
          reportData,
          tests,
          (data, catalog) => generateLabReport(data, getDefaultTemplate(), catalog),
          downloadPDF,
          formatDate
        );
        notify.toast('report.download.success');
      } catch (error) {
        console.error('Error generating report:', error);
        notify.apiError('report.download.error', error);
      } finally {
        setGeneratingOrderId(null);
      }
    },
    [buildReportData, tests]
  );

  const reportTableConfig = useMemo(
    () =>
      createReportTableConfig(navigate, handlePreview, handlePrint, generatingOrderId),
    [navigate, handlePreview, handlePrint, generatingOrderId]
  );

  return (
    <>
      <div className="flex h-full min-h-0 flex-col">
      <ListView
        items={filteredOrders}
        viewConfig={reportTableConfig}
        loading={loading}
        error={error}
        onRetry={refetch}
        onDismissError={() => {}}
        onRowClick={handlePreview}
        title="Reports"
        subtitle={`${filteredOrders.length} report(s) available`}
        filters={
          <ReportFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        }
        pagination={{ mode: 'client', pageSize: 20, pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL }}
        defaultSort={{ key: 'orderDate', direction: 'desc' }}
      />
      </div>
    </>
  );
};
