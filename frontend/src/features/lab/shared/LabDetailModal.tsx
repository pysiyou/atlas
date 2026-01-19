/**
 * LabDetailModal - Shared modal structure for lab workflow detail views
 * 
 * Provides consistent structure for SampleDetail, ResultDetail, and ValidationDetail:
 * - Header with badges
 * - Patient/Order context section
 * - Flexible content sections
 * - Action footer
 */

import React, { type ReactNode } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Badge, SectionContainer } from '@/shared/ui';
import { formatDate } from '@/utils';
import { useUserDisplay } from '@/hooks';

interface ContextInfo {
  patientName: string;
  patientId: string;
  orderId: string;
  referringPhysician?: string;
}

interface SampleInfo {
  sampleId: string;
  collectedAt?: string;
  collectedBy?: string;
}

interface LabDetailModalProps {
  /** Modal open state */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title (e.g., sample ID or test name) */
  title: string;
  /** Modal subtitle (e.g., patient name - sample type) */
  subtitle: string;
  /** React key for forcing re-render on item change */
  modalKey?: string;
  /** Badge elements for the header section */
  headerBadges: ReactNode;
  /** Patient and order context */
  contextInfo: ContextInfo;
  /** Sample collection info (optional) */
  sampleInfo?: SampleInfo;
  /** Additional info line below sample info */
  additionalContextInfo?: ReactNode;
  /** Main content sections */
  children: ReactNode;
  /** Footer actions */
  footer?: ReactNode;
}

/**
 * LabDetailModal provides the shared structure for all lab detail modals
 */
export const LabDetailModal: React.FC<LabDetailModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  modalKey,
  headerBadges,
  contextInfo,
  sampleInfo,
  additionalContextInfo,
  children,
  footer,
}) => {
  const { getUserName } = useUserDisplay();

  return (
    <Modal
      key={modalKey}
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size="3xl"
    >
      <div className="flex flex-col h-full bg-gray-50">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Header Section with Badges and Context */}
          <SectionContainer hideHeader>
            <div className="flex flex-col gap-4">
              {/* Row 1: Badges */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {headerBadges}
                </div>
              </div>

              {/* Row 2: Patient & Order context */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-700 flex-wrap">
                  <span className="font-semibold text-gray-900">{contextInfo.patientName}</span>
                  <span className="text-gray-300">|</span>
                  <span className="font-medium text-gray-900 text-xs">{contextInfo.patientId}</span>
                  <span className="text-gray-300">|</span>
                  <span className="font-medium text-gray-900 text-xs">{contextInfo.orderId}</span>
                  {contextInfo.referringPhysician && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-600">{contextInfo.referringPhysician}</span>
                    </>
                  )}
                </div>

                {/* Collection info */}
                {sampleInfo && sampleInfo.collectedAt && (
                  <span className="text-xs text-gray-500">
                    Sample <span className="font-medium text-gray-900">{sampleInfo.sampleId}</span> collected{' '}
                    <span className="text-gray-700">{formatDate(sampleInfo.collectedAt)}</span>
                    {sampleInfo.collectedBy && <span> by {getUserName(sampleInfo.collectedBy)}</span>}
                  </span>
                )}

                {/* Additional context info */}
                {additionalContextInfo}
              </div>
            </div>
          </SectionContainer>

          {/* Main Content */}
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 bg-white border-t border-gray-200 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </Modal>
  );
};

/**
 * DetailSection - Wrapper for content sections in detail modals
 */
interface DetailSectionProps {
  title: string;
  headerRight?: ReactNode;
  children: ReactNode;
}

export const DetailSection: React.FC<DetailSectionProps> = ({
  title,
  headerRight,
  children,
}) => (
  <SectionContainer title={title} headerRight={headerRight}>
    {children}
  </SectionContainer>
);

/**
 * DetailGrid - Two-column grid for detail sections
 */
interface DetailGridProps {
  children: ReactNode;
}

export const DetailGrid: React.FC<DetailGridProps> = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {children}
  </div>
);

/**
 * ModalFooter - Common footer layout with status message and action buttons
 */
interface ModalFooterProps {
  /** Optional icon to display before status message */
  statusIcon?: ReactNode;
  /** Status message text */
  statusMessage: string;
  /** Custom className for status text */
  statusClassName?: string;
  /** Optional action buttons (displayed on the right side) */
  children?: ReactNode;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  statusIcon,
  statusMessage,
  statusClassName = 'text-gray-600',
  children,
}) => (
  <div className="flex items-center justify-between">
    <div className={`flex items-center gap-2 text-sm ${statusClassName}`}>
      {statusIcon}
      <span>{statusMessage}</span>
    </div>
    <div className="flex items-center gap-3">
      {children}
    </div>
  </div>
);

/**
 * StatusBadgeRow - Row of status badges commonly used in headers
 */
interface StatusBadgeRowProps {
  sampleType?: string;
  priority?: string;
  status?: string;
  extraBadges?: ReactNode;
}

export const StatusBadgeRow: React.FC<StatusBadgeRowProps> = ({
  sampleType,
  priority,
  status,
  extraBadges,
}) => (
  <>
    {sampleType && <Badge variant={sampleType} size="sm" />}
    {priority && <Badge variant={priority} size="sm" />}
    {status && <Badge variant={status} size="sm" />}
    {extraBadges}
  </>
);
