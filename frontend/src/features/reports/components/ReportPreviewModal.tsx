/**
 * Report Preview Modal
 * Preview lab report before generating PDF
 * Uses consistent modal structure matching other detail modals
 */

import React from 'react';
import { Modal, Button, FooterInfo } from '@/components';
import type { ReportData } from '../types';
import { format } from 'date-fns';
import { ICONS } from '@/utils';
import { companyConfig } from '@/config';
import { useUserLookup } from '@/features/admin';
import { ReportPreviewHeader } from './ReportPreviewHeader';
import { ReportPreviewResults } from './ReportPreviewResults';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: ReportData;
  onGenerate: () => void;
  isGenerating?: boolean;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  reportData,
  onGenerate,
  isGenerating = false,
}) => {
  const { getUserName } = useUserLookup();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Preview"
      subtitle={`${reportData.patientName} - ${reportData.testResults.map(t => t.testName).join(', ')}`}
      size="3xl"
      disableClose={isGenerating}
    >
      <div className="flex flex-col h-full bg-surface-page">
        <div className="flex-1 overflow-y-auto ">
          <ReportPreviewHeader reportData={reportData} getUserName={getUserName} />
          <ReportPreviewResults reportData={reportData} />
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border-default bg-surface shrink-0 shadow-[var(--shadow-footer)]">
          <FooterInfo
            icon={ICONS.dataFields.document}
            text={
              <>
                {companyConfig.getReports().footerText} Generated:{' '}
                {format(new Date(), 'MMM dd, yyyy HH:mm')}
              </>
            }
          />
          <div className="flex items-center gap-3">
            <Button variant="cancel" size="md" onClick={onClose} disabled={isGenerating}>
              Close
            </Button>
            <Button
              variant="download"
              size="md"
              onClick={onGenerate}
              disabled={isGenerating}
              isLoading={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
