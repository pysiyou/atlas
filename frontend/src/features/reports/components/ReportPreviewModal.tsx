/**
 * Report Preview Modal
 * Preview lab report before generating PDF
 */

import React from 'react';
import { actionButtonPreset, Button } from '@/components/primitives';
import { Modal, DialogFooter } from '@/components/overlays';
import { FooterInfo, ModalContextSubtitle } from '@/components/display';
import type { LabReportPayload } from '../types';
import { MODULE_ICONS } from '@/config/icons';
import { ReportPreviewResults } from './ReportPreviewResults';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: LabReportPayload;
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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Preview"
      subtitle={
        <ModalContextSubtitle
          label={reportData.patientName}
          orderId={reportData.order.orderId}
        />
      }
      size="3xl"
      disableClose={isGenerating}
    >
      <div className="flex flex-col h-full bg-surface-page">
        <div className="flex-1 overflow-y-auto p-space-6">
          <ReportPreviewResults reportData={reportData} />
        </div>
        <DialogFooter
          start={<FooterInfo icon={MODULE_ICONS.reports} label="Reports" size="md" />}
          end={
            <>
              <Button
                {...actionButtonPreset('download')}
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
