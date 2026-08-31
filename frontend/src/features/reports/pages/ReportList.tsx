/**
 * ReportList Component - Migrated to use ListView
 *
 * Displays a list of validated tests ready for report generation.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestCatalog } from '@/features/catalog/api/useTestCatalog';
import { useUserLookup } from '@/features/admin/api/useUsers';
import { usePatientNameLookup, usePatientsList } from '@/features/patients/api/usePatients';
import { useOrdersList } from '@/features/orders/api/useOrderQueries';
import { useSampleLookup } from '@/features/collection/api/useSamples';
import { useFiltering } from '@/hooks/useFiltering';
import { ListView } from '@/components';
import { DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL } from '@/components';
import { createReportTableConfig } from './ReportTableConfig';
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
import { toast } from '@/app/AppToastBar';

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
        message: queryError instanceof Error ? queryError.message : 'Failed to load reports',
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
  } = useFiltering<ValidatedTest, never>(validatedTests, {
    searchFields: test => [
      test.testId.toString(),
      test.orderId.toString(),
      test.testCode,
      test.testName,
      test.patientId.toString(),
      test.patientName,
    ],
    defaultSort: { field: 'orderDate', direction: 'desc' },
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
      toast.success({
        title: 'Report downloaded successfully',
        subtitle:
          'The report has been generated and the download should start shortly. Check your downloads folder.',
      });
      setPreviewTest(null);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error({
        title: 'Failed to generate report',
        subtitle:
          'The report could not be generated. Please try again or contact support if the issue persists.',
      });
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
        mode="table"
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
        pagination={true}
        pageSize={20}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL}
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
