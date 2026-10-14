/**
 * ReportDetail Component
 * Detail view for a specific report - opens preview modal for a reportable order
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTestCatalog } from '@/features/catalog';
import { useUserLookup } from '@/lib/api/users';
import { reportsAPI, useReportableOrders } from '../api/reports';
import { useSampleLookup } from '@/features/lab';
import { ReportPreviewModal } from '../components/ReportPreviewModal';
import { generateLabReport, downloadPDF } from '../utils/reportPDF';
import {
  prepareReportData,
  downloadLabReport,
} from '../utils/prepareReportData';
import { formatDate } from '@/utils';
import { notify } from '@/utils/feedback';
import { DetailPageShell, PageHeader } from '@/components/layout';
import { ReportDetailSkeletonContent } from '../config/ReportDetailSkeleton';

export const ReportDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const orderId = id ? parseInt(id, 10) : null;

  const { reportableOrders, isLoading: reportsLoading } = useReportableOrders();
  const { tests, isLoading: testsLoading } = useTestCatalog();
  const { getSample } = useSampleLookup();
  const { getUserName } = useUserLookup();

  const [isGenerating, setIsGenerating] = useState(false);

  const reportableOrder = useMemo(() => {
    if (!orderId) return null;
    return reportableOrders.find(order => order.orderId === orderId) ?? null;
  }, [orderId, reportableOrders]);

  useEffect(() => {
    if (!reportsLoading && !testsLoading && !reportableOrder) {
      navigate('/reports', { replace: true });
    }
  }, [reportsLoading, testsLoading, reportableOrder, navigate]);

  const buildReportData = useCallback(() => {
    if (!reportableOrder) return null;
    return prepareReportData({
      reportableOrder,
      patients: undefined,
      catalogTests: tests,
      getSample,
      getUserName: id => getUserName(id),
    });
  }, [reportableOrder, tests, getSample, getUserName]);

  const handleGenerateReport = async () => {
    if (!reportableOrder) return;
    const reportData = buildReportData();
    if (!reportData) return;

    try {
      setIsGenerating(true);
      await reportsAPI.recordOrderReportDownload(reportableOrder.orderId);
      await downloadLabReport(
        reportableOrder,
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

  if (!reportableOrder) {
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
