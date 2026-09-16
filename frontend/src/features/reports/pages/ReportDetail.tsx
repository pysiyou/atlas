/**
 * ReportDetail Component
 * Detail view for a specific report - opens preview modal for a validated test
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTestCatalog } from '@/features/catalog';
import { useUserLookup } from '@/lib/api/users';
import { useValidatedTestsReport } from '../api/reports';
import { useSampleLookup } from '@/features/lab';
import { ReportPreviewModal } from '../components/ReportPreviewModal';
import { generateLabReport, downloadPDF } from '../utils/reportPDF';
import {
  prepareReportData,
  downloadValidatedTestReport,
} from '../utils/prepareReportData';
import { formatDate } from '@/utils';
import { notify } from '@/utils/feedback';
import { DetailPageShell, PageHeader } from '@/components';
import { ReportDetailSkeletonContent } from '../config/ReportDetailSkeleton';

export const ReportDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const testId = id ? parseInt(id, 10) : null;

  const { validatedTests, isLoading: reportsLoading } = useValidatedTestsReport();
  const { tests, isLoading: testsLoading } = useTestCatalog();
  const { getSample } = useSampleLookup();
  const { getUserName } = useUserLookup();

  const [isGenerating, setIsGenerating] = useState(false);

  const validatedTest = useMemo(() => {
    if (!testId) return null;
    return validatedTests.find(test => test.testId === testId) ?? null;
  }, [testId, validatedTests]);

  useEffect(() => {
    if (!reportsLoading && !testsLoading && !validatedTest) {
      navigate('/reports', { replace: true });
    }
  }, [reportsLoading, testsLoading, validatedTest, navigate]);

  const buildReportData = useCallback(() => {
    if (!validatedTest) return null;
    return prepareReportData({
      validatedTest,
      patients: undefined,
      catalogTests: tests,
      getSample,
      getUserName: id => getUserName(id),
    });
  }, [validatedTest, tests, getSample, getUserName]);

  const handleGenerateReport = async () => {
    if (!validatedTest) return;
    const reportData = buildReportData();
    if (!reportData) return;

    try {
      setIsGenerating(true);
      await downloadValidatedTestReport(
        validatedTest,
        reportData,
        generateLabReport,
        downloadPDF,
        formatDate
      );
      notify.toast('report.download.success');
      navigate('/reports');
    } catch (error) {
      console.error('Error generating report:', error);
      notify.apiError('report.download.error', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    navigate('/reports');
  };

  if (reportsLoading || testsLoading) {
    return (
      <DetailPageShell
        header={<PageHeader title="Report" />}
        loading
        loadingSkeleton={<ReportDetailSkeletonContent />}
      >
        {null}
      </DetailPageShell>
    );
  }

  if (!validatedTest) {
    return null;
  }

  const reportData = buildReportData();
  if (!reportData) {
    return null;
  }

  return (
    <ReportPreviewModal
      isOpen={true}
      onClose={handleClose}
      reportData={reportData}
      onGenerate={handleGenerateReport}
      isGenerating={isGenerating}
    />
  );
};
