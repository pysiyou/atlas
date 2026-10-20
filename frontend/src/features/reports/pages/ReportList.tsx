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

  const { openModal, closeModal } = useModal();
  const [generatingOrderId, setGeneratingOrderId] = useState<number | null>(null);
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

  const handlePreview = useCallback(
    (reportableOrder: ReportableOrder) => {
      const reportData = buildReportData(reportableOrder);
      openModal(ModalType.REPORT_PREVIEW, {
        reportData,
        onGenerate: async () => {
          try {
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
            closeModal();
          } catch (error) {
            console.error('Error generating report:', error);
            notify.apiError('report.download.error', error);
            throw error;
          }
        },
      });
    },
    [buildReportData, tests, openModal, closeModal]
  );

  const handlePrint = useCallback(
    async (reportableOrder: ReportableOrder) => {
      try {
        setGeneratingOrderId(reportableOrder.orderId);
        const reportData = buildReportData(reportableOrder);
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
      createReportTableConfig(
        navigate,
        getPatientName,
        handlePreview,
        handlePrint,
        generatingOrderId
      ),
    [navigate, getPatientName, handlePrint, generatingOrderId]
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
    </>
  );
};
