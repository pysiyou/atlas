/**
 * ReportList Component - Migrated to use ListView
 *
 * Displays a list of validated tests ready for report generation.
 * Each validated test gets its own report entry.
 * Uses TanStack Query hooks for efficient data fetching and caching.
 * Now uses shared ListView component for consistent UX.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useOrdersList,
  usePatientsList,
  useTestCatalog,
  usePatientNameLookup,
  useSampleLookup,
  useUserLookup,
} from '@/hooks/queries';
import { useFiltering } from '@/utils/filtering';
import { ListView } from '@/shared/components';
import { DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL } from '@/shared/ui/Table';
import { createReportTableConfig } from './ReportTableConfig';
import { ReportPreviewModal } from '../components/ReportPreviewModal';
import { ReportFilters } from '../components/ReportFilters';
import { generateLabReport, downloadPDF } from '../utils/reportPDF';
import type { ReportData, ValidatedTest } from '../types';
import { formatDate } from '@/utils';
import { companyConfig } from '@/config';
import { toast } from '@/shared/components/feedback';

/**
 * ReportList Component
 *
 * Benefits of ListView migration:
 * - Reduced code by ~80 lines
 * - Consistent UX with other list views
 * - Built-in loading/error/empty states
 * - Easy to add grid view in future
 * - Each test has its own report entry
 */
export const ReportList: React.FC = () => {
  const navigate = useNavigate();

  // Use query hooks - data is cached and shared across components
  const { orders, isLoading: ordersLoading, isError, error: queryError, refetch } = useOrdersList();
  const { patients, isLoading: patientsLoading } = usePatientsList();
  const { tests, isLoading: testsLoading } = useTestCatalog();
  const { getPatientName } = usePatientNameLookup();
  const { getSample } = useSampleLookup();
  const { getUserName, isLoading: usersLoading } = useUserLookup();

  // Combined loading state
  const loading = ordersLoading || patientsLoading || testsLoading || usersLoading;

  // Format error for ErrorAlert component
  const error = isError
    ? {
        message: queryError instanceof Error ? queryError.message : 'Failed to load reports',
        operation: 'load' as const,
      }
    : null;

  // State for preview modal
  const [previewTest, setPreviewTest] = useState<ValidatedTest | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // State for filters
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);

  // Transform orders into individual validated test entries
  const validatedTests = useMemo(() => {
    const tests: ValidatedTest[] = [];
    
    orders.forEach(order => {
      order.tests
        .filter(test => test.status === 'validated' && test.id)
        .forEach(test => {
          const patient = patients?.find(p => p.id === order.patientId);
          
          // Calculate age if DOB available
          let age: number | undefined;
          if (patient?.dateOfBirth) {
            const birthDate = new Date(patient.dateOfBirth);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
          }
          
          tests.push({
            testId: test.id!,
            testCode: test.testCode,
            testName: test.testName,
            orderId: order.orderId,
            orderDate: order.orderDate,
            patientId: order.patientId,
            patientName: getPatientName(order.patientId),
            patientAge: age,
            patientGender: patient?.gender,
            test,
            order,
          });
        });
    });
    
    return tests;
  }, [orders, patients, getPatientName]);

  // Use shared filtering hook for search
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

  // Apply date range filter
  const filteredTests = useMemo(() => {
    let filtered = preFilteredTests;

    // Apply date range
    if (dateRange) {
      const [start, end] = dateRange;
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);

      filtered = filtered.filter(test => {
        const orderDate = new Date(test.orderDate);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    return filtered;
  }, [preFilteredTests, dateRange]);

  /**
   * Prepare report data from validated test
   * Each test generates its own report with only that test's results
   */
  const prepareReportData = (validatedTest: ValidatedTest): ReportData => {
    const { test, order } = validatedTest;

    // Find patient to get phone and email
    const patient = patients?.find(p => p.id === validatedTest.patientId);

    // Get sample collection data if sampleId is available
    const sample = test.sampleId ? getSample(test.sampleId) : undefined;
    const collectedAt = sample && sample.status === 'collected' 
      ? (sample as { collectedAt?: string }).collectedAt 
      : undefined;
    const collectedBy = sample && sample.status === 'collected' 
      ? (sample as { collectedBy?: string }).collectedBy 
      : undefined;

    // Find test in catalog to get parameter names
    const catalogTest = tests.find(t => t.code === test.testCode);

    const testResults = [{
      testCode: test.testCode,
      testName: test.testName,
      parameters: Object.entries(test.results || {}).map(([code, result]) => {
        // Look up parameter name from catalog
        const parameter = catalogTest?.parameters?.find(p => p.code === code);
        const fullName = parameter?.name || code;
        
        return {
          name: fullName,
          code,
          value: result.value,
          unit: result.unit,
          referenceRange: result.referenceRange,
          status: result.status,
          isCritical:
            result.status === 'critical' ||
            result.status === 'critical-high' ||
            result.status === 'critical-low',
        };
      }),
      technicianNotes: test.technicianNotes,
      validationNotes: test.validationNotes,
      enteredBy: test.enteredBy?.toString(),
      validatedBy: test.validatedBy?.toString(),
      validatedByName: test.validatedBy 
        ? getUserName(String(test.validatedBy).trim())
        : undefined,
      enteredAt: test.resultEnteredAt,
      validatedAt: test.resultValidatedAt,
    }];

    // Extend order with patient contact info
    const orderWithPatientInfo = {
      ...order,
      patientPhone: patient?.phone,
      patientEmail: patient?.email,
    };

    return {
      order: orderWithPatientInfo,
      patientId: validatedTest.patientId,
      patientName: validatedTest.patientName,
      patientAge: validatedTest.patientAge,
      patientGender: validatedTest.patientGender,
      timestamps: {
        registeredAt: order.orderDate || order.createdAt,
        collectedAt,
        reportedAt: test.resultValidatedAt || new Date().toISOString(),
      },
      sampleCollection: {
        collectedAt,
        collectedBy,
        address: companyConfig.getContact().address.fullAddress,
      },
      testResults,
    };
  };

  /**
   * Handle preview button click
   */
  const handlePreview = (validatedTest: ValidatedTest) => {
    setPreviewTest(validatedTest);
  };

  /**
   * Handle report generation
   */
  const handleGenerateReport = async () => {
    if (!previewTest) return;

    try {
      setIsGenerating(true);
      const reportData = prepareReportData(previewTest);
      const doc = generateLabReport(reportData);

      const filename = `Lab_Report_TST${previewTest.testId.toString().padStart(6, '0')}_${formatDate(new Date())}.pdf`;
      downloadPDF(doc, filename);

      toast.success({
        title: 'Report downloaded successfully',
        subtitle: 'The report has been generated and the download should start shortly. Check your downloads folder.',
      });
      setPreviewTest(null);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error({
        title: 'Failed to generate report',
        subtitle: 'The report could not be generated. Please try again or contact support if the issue persists.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Memoize table config to prevent recreation on every render
  const reportTableConfig = useMemo(
    () => createReportTableConfig(navigate, getPatientName, handlePreview),
    [navigate, getPatientName]
  );

  const handleDismissError = () => {
    // Error will be cleared on next successful fetch
  };

  return (
    <>
      <ListView
        mode="table"
        items={filteredTests}
        viewConfig={reportTableConfig}
        loading={loading}
        error={error}
        onRetry={refetch}
        onDismissError={handleDismissError}
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

      {/* Report Preview Modal */}
      {previewTest && (
        <ReportPreviewModal
          isOpen={!!previewTest}
          onClose={() => setPreviewTest(null)}
          reportData={prepareReportData(previewTest)}
          onGenerate={handleGenerateReport}
          isGenerating={isGenerating}
        />
      )}
    </>
  );
};
