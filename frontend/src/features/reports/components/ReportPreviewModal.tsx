/**
 * Report Preview Modal
 * Preview lab report before generating PDF
 */

import React, { useState } from 'react';
import type { BaseModalProps } from '@/lib/context/modalTypes';
import { actionButtonPreset, Button } from '@/components/primitives';
import {
  DialogFooter,
  Modal,
  ModalPageShell,
  MODAL_WORKFLOW_BODY_STACK,
} from '@/components/overlays';
import { FooterInfo, ModalContextSubtitle } from '@/components/display';
import type { LabReportPayload } from '../types';
import { MODULE_ICONS } from '@/config/icons';
import { ReportPreviewResults } from './ReportPreviewResults';

export interface ReportPreviewModalProps extends BaseModalProps {
  reportData: LabReportPayload;
  onGenerate: () => void | Promise<void>;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  reportData,
  onGenerate,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate();
    } finally {
      setIsGenerating(false);
    }
  };

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
      <ModalPageShell
        bodyClassName={MODAL_WORKFLOW_BODY_STACK}
        footer={
          <DialogFooter
            start={<FooterInfo icon={MODULE_ICONS.reports} label="Reports" size="md" />}
            end={
              <Button
                {...actionButtonPreset('download')}
                size="md"
                layout="icon-text"
                onClick={handleGenerate}
                disabled={isGenerating}
                isLoading={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Download PDF'}
              </Button>
            }
          />
        }
      >
        <ReportPreviewResults reportData={reportData} />
      </ModalPageShell>
    </Modal>
  );
};
