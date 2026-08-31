/**
 * ReportDetail Component
 * Detail view for a specific report - opens preview modal for a validated test
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTestCatalog } from '@/features/catalog/data/tests';
import { useUserLookup } from '@/features/users';
import { usePatientNameLookup, usePatientsList } from '@/features/patients/data/patients';
import { useOrdersList } from '@/features/orders/data/orders';
import { useSampleLookup } from '@/features/lab-collection/data/samples';
import { ReportPreviewModal } from '../components/ReportPreviewModal';
import { generateLabReport, downloadPDF } from '../utils/reportPDF';
import {
  findValidatedTestById,
  prepareReportData,
  downloadValidatedTestReport,
} from '../utils/prepareReportData';
import { formatDate } from '@/utils';
import { toast } from '@/app/AppToastBar';
import { DetailPageShell, DetailPageHeader } from '@/components';
import { ReportDetailSkeletonContent } from '../config/reportDetailSkeleton';

export const ReportDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const testId = id ? parseInt(id, 10) : null;

  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { patients, isLoading: patientsLoading } = usePatientsList();
  const { tests, isLoading: testsLoading } = useTestCatalog();
  const { getPatientName } = usePatientNameLookup();
  const { getSample } = useSampleLookup();
  const { getUserName } = useUserLookup();

  const [isGenerating, setIsGenerating] = useState(false);

  const validatedTest = useMemo(() => {
    if (!testId) return null;
    return findValidatedTestById(testId, orders, patients, getPatientName);
  }, [testId, orders, patients, getPatientName]);

  useEffect(() => {
    if (!ordersLoading && !patientsLoading && !testsLoading && !validatedTest) {
      navigate('/reports', { replace: true });
    }
  }, [ordersLoading, patientsLoading, testsLoading, validatedTest, navigate]);

  const buildReportData = useCallback(() => {
    if (!validatedTest) return null;
    return prepareReportData({
      validatedTest,
      patients,
      catalogTests: tests,
      getSample,
      getUserName: id => getUserName(id),
    });
  }, [validatedTest, patients, tests, getSample, getUserName]);

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
      toast.success({
        title: 'Report downloaded successfully',
        subtitle:
          'The report has been generated and the download should start shortly. Check your downloads folder.',
      });
      navigate('/reports');
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

  const handleClose = () => {
    navigate('/reports');
  };

  if (ordersLoading || patientsLoading || testsLoading) {
    return (
      <DetailPageShell
        header={<DetailPageHeader title="Report" />}
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
