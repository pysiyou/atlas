/**
 * Report Preview Modal — loads reportable order by id and generates the PDF itself.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReportPreviewModalProps } from '@/lib/context/modalTypes';
import { actionButtonPreset, Button } from '@/components/primitives';
import {
  DialogFooter,
  Modal,
  ModalPageShell,
  MODAL_WORKFLOW_BODY_STACK,
} from '@/components/overlays';
import { FooterInfo, ModalContextSubtitle } from '@/components/display';
import { MODULE_ICONS } from '@/config/icons';
import { ReportPreviewResults } from './ReportPreviewResults';
import { uniqueSortedTestCodes, useTestsByCodes } from '@/features/catalog';
import { useUserLookup } from '@/lib/api/users';
import { createSampleLookupForOrder } from '@/features/lab';
import { reportsAPI, useReportableOrder } from '../api/reports';
import { generateLabReport, downloadPDF, getDefaultTemplate } from '../utils/reportPDF';
import { downloadLabReport, prepareReportData } from '../utils/prepareReportData';
import type { LabReportPayload } from '../types';
import { formatDate } from '@/utils';
import { notify } from '@/utils/feedback';

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  isActive = true,
  orderId,
}) => {
  const { getUserName } = useUserLookup();
  const { reportableOrder, isLoading, isError } = useReportableOrder(isOpen ? orderId : null);
  const orderTestCodes = useMemo(
    () =>
      uniqueSortedTestCodes(
        reportableOrder?.testCodes.length
          ? reportableOrder.testCodes
          : (reportableOrder?.order?.tests ?? []).map(test => test.testCode)
      ),
    [reportableOrder]
  );
  const { tests, isLoading: catalogLoading } = useTestsByCodes(orderTestCodes);
  const [reportData, setReportData] = useState<LabReportPayload | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isOpen || !reportableOrder?.order || (orderTestCodes.length > 0 && catalogLoading)) {
      if (!isOpen || !reportableOrder?.order) setReportData(null);
      return;
    }

    let cancelled = false;
    setIsBuilding(true);
    void (async () => {
      try {
        const getSample = await createSampleLookupForOrder(reportableOrder.orderId);
        const payload = prepareReportData({
          reportableOrder,
          patients: undefined,
          catalogTests: tests,
          getSample,
          getUserName: id => getUserName(id),
        });
        if (!cancelled) setReportData(payload);
      } catch (error) {
        if (!cancelled) {
          notify.apiError('report.download.error', error);
          setReportData(null);
        }
      } finally {
        if (!cancelled) setIsBuilding(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, reportableOrder, orderTestCodes.length, catalogLoading, tests, getUserName]);

  const handleGenerate = useCallback(async () => {
    if (!reportableOrder || !reportData) return;
    setIsGenerating(true);
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
      onClose();
    } catch (error) {
      console.error('Error generating report:', error);
      notify.apiError('report.download.error', error);
    } finally {
      setIsGenerating(false);
    }
  }, [reportableOrder, reportData, tests, onClose]);

  const waiting = isLoading || isBuilding || catalogLoading || !reportData;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Preview"
      subtitle={
        reportData ? (
          <ModalContextSubtitle
            label={reportData.patientName}
            orderId={reportData.order.orderId}
          />
        ) : undefined
      }
      size="3xl"
      disableClose={isGenerating}
      isActive={isActive}
    >
      <ModalPageShell
        bodyClassName={MODAL_WORKFLOW_BODY_STACK}
        loading={waiting}
        footer={
          <DialogFooter
            start={<FooterInfo icon={MODULE_ICONS.reports} label="Reports" size="md" />}
            end={
              <Button
                {...actionButtonPreset('download')}
                size="md"
                layout="icon-text"
                onClick={() => void handleGenerate()}
                disabled={isGenerating || waiting || isError}
                isLoading={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Download PDF'}
              </Button>
            }
          />
        }
      >
        {reportData ? <ReportPreviewResults reportData={reportData} /> : null}
      </ModalPageShell>
    </Modal>
  );
};
