/**
 * Report Preview Modal
 * Preview lab report before generating PDF
 * Uses consistent modal structure matching other detail modals
 */

import React from 'react';
import { Modal, Button, FooterInfo, DialogFooter } from '@/components';
import type { ReportData } from '../types';
import { MODULE_ICONS } from '@/config/icons';
import { useUserLookup } from '@/lib/api/users.api';
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

        <DialogFooter
          start={<FooterInfo icon={MODULE_ICONS.reports} label="Reports" size="md" />}
          end={
            <>
              <Button variant="cancel" size="md" layout="icon-text" onClick={onClose} disabled={isGenerating}>
                Close
              </Button>
              <Button
                variant="download"
                size="md"
                layout="icon-text"
                onClick={onGenerate}
                disabled={isGenerating}
                isLoading={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Download PDF'}
              </Button>
            </>
          }
        />
      </div>
    </Modal>
  );
};
