/**
 * ReportList Component - Migrated to use ListView
 *
 * Displays a list of validated tests ready for report generation.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestCatalog } from '@/features/catalog';
import { useUserLookup } from '@/lib/api/users.api';
import { usePatientNameLookup, usePatientsList } from '@/features/patients';
import { useOrdersList } from '@/features/orders';
import { useSampleLookup } from '@/features/lab';
import { useClientListFilter } from '@/hooks/useClientListFilter';
import { ListView } from '@/components';
import { DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL } from '@/components';
import { createReportTableConfig } from '../config/ReportTable.config';
import { ReportPreviewModal } from '../components/ReportPreviewModal';
import { ReportFilters } from '../components/ReportFilters';
import { generateLabReport, downloadPDF } from '../utils/reportPDF';
import type { ValidatedTest } from '../types';
import {
  buildValidatedTestsFromOrders,
  filterValidatedTestsByDateRange,
  prepareReportData,
  downloadValidatedTestReport,
} from '../utils/prepareReportData';
import { formatDate } from '@/utils';
import { notify, errorAlertMessage } from '@/utils/feedback';

export const ReportList: React.FC = () => {
  const navigate = useNavigate();

  const { orders, isLoading: ordersLoading, isError, error: queryError, refetch } = useOrdersList();
  const { patients, isLoading: patientsLoading } = usePatientsList();
  const { tests, isLoading: testsLoading } = useTestCatalog();
  const { getPatientName } = usePatientNameLookup();
  const { getSample } = useSampleLookup();
  const { getUserName, isLoading: usersLoading } = useUserLookup();

  const loading = ordersLoading || patientsLoading || testsLoading || usersLoading;

  const error = isError
    ? {
        message: errorAlertMessage('reports.list.loadFailed', queryError),
        operation: 'load' as const,
      }
    : null;

  const [previewTest, setPreviewTest] = useState<ValidatedTest | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);

  const validatedTests = useMemo(
    () => buildValidatedTestsFromOrders(orders, patients, getPatientName),
    [orders, patients, getPatientName]
  );

  const {
    filteredItems: preFilteredTests,
    searchQuery,
    setSearchQuery,
  } = useClientListFilter<ValidatedTest, never>(validatedTests, {
    searchFields: test => [
      test.testId.toString(),
      test.orderId.toString(),
      test.testCode,
      test.testName,
      test.patientId.toString(),
      test.patientName,
    ],
    defaultSort: undefined,
  });

  const filteredTests = useMemo(
    () => filterValidatedTestsByDateRange(preFilteredTests, dateRange),
    [preFilteredTests, dateRange]
  );

  const buildReportData = useCallback(
    (validatedTest: ValidatedTest) =>
      prepareReportData({
        validatedTest,
        patients,
        catalogTests: tests,
        getSample,
        getUserName: id => getUserName(id),
      }),
    [patients, tests, getSample, getUserName]
  );

  const handlePreview = (validatedTest: ValidatedTest) => {
    setPreviewTest(validatedTest);
  };

  const handleGenerateReport = async () => {
    if (!previewTest) return;

    try {
      setIsGenerating(true);
      const reportData = buildReportData(previewTest);
      await downloadValidatedTestReport(
        previewTest,
        reportData,
        generateLabReport,
        downloadPDF,
        formatDate
      );
      notify.toast('report.download.success');
      setPreviewTest(null);
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
      <ListView
        items={filteredTests}
        viewConfig={reportTableConfig}
        loading={loading}
        error={error}
        onRetry={refetch}
        onDismissError={() => {}}
        onRowClick={(test: ValidatedTest) => navigate(`/reports/${test.testId}`)}
        title="Reports"
        subtitle={`${filteredTests.length} report(s) available`}
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

      {previewTest && (
        <ReportPreviewModal
          isOpen={!!previewTest}
          onClose={() => setPreviewTest(null)}
          reportData={buildReportData(previewTest)}
          onGenerate={handleGenerateReport}
          isGenerating={isGenerating}
        />
      )}
    </>
  );
};
