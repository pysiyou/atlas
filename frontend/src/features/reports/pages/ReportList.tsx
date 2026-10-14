/**
 * ReportList Component - Migrated to use ListView
 *
 * Displays a list of reportable orders ready for report generation.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestCatalog } from '@/features/catalog';
import { useUserLookup } from '@/lib/api/users';
import { usePatientNameLookup } from '@/features/patients';
import { useSampleLookup } from '@/features/lab';
import { reportsAPI, useReportableOrders } from '../api/reports';
import { useClientListFilter } from '@/hooks/useClientListFilter';
import { ListView } from '@/components/surfaces';
import { DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL } from '@/components/data-table';
import { createReportTableConfig } from '../config/ReportTable.config';
import { ReportPreviewModal } from '../components/ReportPreviewModal';
import { ReportFilters } from '../components/ReportFilters';
import { generateLabReport, downloadPDF } from '../utils/reportPDF';
import type { ReportableOrder } from '../types';
import {
  filterReportableOrdersByDateRange,
  getActiveOrderTests,
  prepareReportData,
  downloadLabReport,
} from '../utils/prepareReportData';
import { formatDate } from '@/utils';
import { notify, errorAlertMessage } from '@/utils/feedback';

export const ReportList: React.FC = () => {
  const navigate = useNavigate();

  const {
    reportableOrders,
    isLoading: reportsLoading,
    isError,
    error: queryError,
    refetch,
  } = useReportableOrders();
  const { tests, isLoading: testsLoading } = useTestCatalog();
  const { getPatientName } = usePatientNameLookup();
  const { getSample } = useSampleLookup();
  const { getUserName, isLoading: usersLoading } = useUserLookup();

  const loading = reportsLoading || testsLoading || usersLoading;

  const error = isError
    ? {
        message: errorAlertMessage('reports.list.loadFailed', queryError),
        operation: 'load' as const,
      }
    : null;

  const [previewOrder, setPreviewOrder] = useState<ReportableOrder | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);

  const {
    filteredItems: preFilteredOrders,
    searchQuery,
    setSearchQuery,
  } = useClientListFilter<ReportableOrder, never>(reportableOrders, {
    searchFields: order => [
      order.orderId.toString(),
      order.patientId.toString(),
      order.patientName,
      ...getActiveOrderTests(order.order).flatMap(test => [test.testCode, test.testName]),
    ],
    defaultSort: undefined,
  });

  const filteredOrders = useMemo(
    () => filterReportableOrdersByDateRange(preFilteredOrders, dateRange),
    [preFilteredOrders, dateRange]
  );

  const buildReportData = useCallback(
    (reportableOrder: ReportableOrder) =>
      prepareReportData({
        reportableOrder,
        patients: undefined,
        catalogTests: tests,
        getSample,
        getUserName: id => getUserName(id),
      }),
    [tests, getSample, getUserName]
  );

  const handlePreview = (reportableOrder: ReportableOrder) => {
    setPreviewOrder(reportableOrder);
  };

  const handleGenerateReport = async () => {
    if (!previewOrder) return;

    try {
      setIsGenerating(true);
      const reportData = buildReportData(previewOrder);
      await reportsAPI.recordOrderReportDownload(previewOrder.orderId);
      await downloadLabReport(
        previewOrder,
        reportData,
        generateLabReport,
        downloadPDF,
        formatDate
      );
      notify.toast('report.download.success');
      setPreviewOrder(null);
    } catch (error) {
      console.error('Error generating report:', error);
      notify.apiError('report.download.error', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const reportTableConfig = useMemo(
    () => createReportTableConfig(navigate, getPatientName, handlePreview),
    [navigate, getPatientName]
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
        onRowClick={(order: ReportableOrder) => navigate(`/reports/${order.orderId}`)}
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

      {previewOrder && (
        <ReportPreviewModal
          isOpen={!!previewOrder}
          onClose={() => setPreviewOrder(null)}
          reportData={buildReportData(previewOrder)}
          onGenerate={handleGenerateReport}
          isGenerating={isGenerating}
        />
      )}
    </>
  );
};
