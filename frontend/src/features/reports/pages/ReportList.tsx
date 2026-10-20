/**
 * ReportList — server-paginated reportable orders.
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTestCatalog } from '@/features/catalog';
import { useUserLookup } from '@/lib/api/users';
import { createSampleLookupForOrder } from '@/features/lab';
import { reportsAPI, usePaginatedReportableOrders } from '../api/reports';
import { ListView } from '@/components/surfaces';
import { createReportTableConfig } from '../config/ReportTable.config';
import { ReportFilters } from '../components/ReportFilters';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import { generateLabReport, downloadPDF, getDefaultTemplate } from '../utils/reportPDF';
import type { ReportableOrder } from '../types';
import { prepareReportData, downloadLabReport } from '../utils/prepareReportData';
import { formatDate, inclusiveDateRangeBounds, toIsoDateParam } from '@/utils';
import { notify, errorAlertMessage } from '@/utils/feedback';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';

/** Parse `/reports/:id` so a deep link can open preview without unmounting the list. */
function parseReportOrderId(id: string | undefined): number | null {
  if (!id) return null;
  const orderId = Number.parseInt(id, 10);
  return Number.isFinite(orderId) ? orderId : null;
}

export const ReportList: React.FC = () => {
  const navigate = useNavigate();
  const { id: routeOrderId } = useParams<{ id?: string }>();
  const deepLinkOrderId = parseReportOrderId(routeOrderId);
  const openedDeepLinkIdRef = useRef<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);

  const serverFilters = useMemo(() => {
    const bounds = inclusiveDateRangeBounds(dateRange);
    return {
      search: searchQuery.trim() || undefined,
      dateFrom: bounds ? toIsoDateParam(bounds.start) : undefined,
      dateTo: bounds ? toIsoDateParam(bounds.end) : undefined,
    };
  }, [searchQuery, dateRange]);

  const {
    reportableOrders,
    pagination,
    isLoading: reportsLoading,
    isError,
    error: queryError,
    refetch,
    page,
    goToPage,
    resetPage,
  } = usePaginatedReportableOrders(serverFilters);

  const { tests } = useTestCatalog();
  const { getUserName } = useUserLookup();

  const error = isError
    ? {
        message: errorAlertMessage('reports.list.loadFailed', queryError),
        operation: 'load' as const,
      }
    : null;

  const { openModal } = useModal();
  const [generatingOrderId, setGeneratingOrderId] = useState<number | null>(null);

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
    () => createReportTableConfig(navigate, handlePreview, handlePrint, generatingOrderId),
    [navigate, handlePreview, handlePrint, generatingOrderId]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ListView
        items={reportableOrders}
        viewConfig={reportTableConfig}
        loading={reportsLoading}
        error={error}
        onRetry={refetch}
        onDismissError={() => {}}
        onRowClick={handlePreview}
        title="Reports"
        subtitle={`${pagination.total} report(s) available`}
        filters={
          <ReportFilters
            searchQuery={searchQuery}
            onSearchChange={value => {
              setSearchQuery(value);
              resetPage();
            }}
            dateRange={dateRange}
            onDateRangeChange={value => {
              setDateRange(value);
              resetPage();
            }}
          />
        }
        pagination={{
          mode: 'server',
          currentPage: page,
          pageSize: pagination.pageSize,
          totalItems: pagination.total,
          onPageChange: goToPage,
          pageSizeOptions: [DEFAULT_LIST_PAGE_SIZE],
        }}
        defaultSort={{ key: 'orderDate', direction: 'desc' }}
      />
    </div>
  );
};
