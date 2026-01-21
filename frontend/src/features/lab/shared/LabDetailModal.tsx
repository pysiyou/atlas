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
import { Badge, SectionContainer, DetailFieldGroup } from '@/shared/ui';
import type { DetailFieldConfig } from '@/shared/ui/DetailFieldGroup';
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
 * 
 * @deprecated Use SectionContainer directly from '@/shared/ui' instead.
 * This wrapper is kept for backward compatibility with existing components.
 * 
 * @example
 * // Instead of:
 * <DetailSection title="Section">...</DetailSection>
 * 
 * // Use:
 * <SectionContainer title="Section" spacing="normal">...</SectionContainer>
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
  <SectionContainer title={title} headerRight={headerRight} spacing="normal">
    {children}
  </SectionContainer>
);

/**
 * Configuration for a section in the DetailGrid
 */
export interface DetailGridSectionConfig {
  /** Section title */
  title: string;
  /** Array of field configurations for this section */
  fields: DetailFieldConfig[];
  /** Content to display in the header right side */
  headerRight?: ReactNode;
}

/**
 * DetailGrid - Two-column grid for detail sections
 * 
 * Can be used in two ways:
 * 1. With children (legacy): Pass DetailSection components as children
 * 2. With sections config (new): Pass array of section configurations
 * 
 * @example
 * // Using sections config (recommended)
 * <DetailGrid
 *   sections={[
 *     {
 *       title: "Collection Information",
 *       fields: [
 *         { label: "Sample ID", badge: { value: "SAM-001", variant: "primary" } },
 *         { label: "Collected", timestamp: "2024-01-01", user: "user123" },
 *       ]
 *     },
 *     {
 *       title: "Test Information",
 *       fields: [
 *         { label: "Test Code", badge: { value: "CBC", variant: "primary" } },
 *       ]
 *     }
 *   ]}
 * />
 * 
 * @example
 * // Using children (legacy)
 * <DetailGrid>
 *   <DetailSection title="Section 1">...</DetailSection>
 *   <DetailSection title="Section 2">...</DetailSection>
 * </DetailGrid>
 */
interface DetailGridProps {
  /** Child elements (legacy usage) */
  children?: ReactNode;
  /** Section configurations (new declarative approach) */
  sections?: DetailGridSectionConfig[];
}

export const DetailGrid: React.FC<DetailGridProps> = ({ children, sections }) => {
  // If sections config is provided, render using the new declarative approach
  if (sections && sections.length > 0) {
    // Filter out sections with no displayable fields
    const visibleSections = sections.filter(section => {
      return section.fields.some(field => {
        if (field.hidden) return false;
        const hasValue = field.value !== undefined && field.value !== null && field.value !== '';
        const hasTimestamp = field.timestamp !== undefined && field.timestamp !== '';
        const hasBadge = field.badge?.value !== undefined && field.badge?.value !== '';
        return hasValue || hasTimestamp || hasBadge;
      });
    });

    if (visibleSections.length === 0) {
      return null;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleSections.map((section) => (
          <SectionContainer 
            key={section.title} 
            title={section.title}
            headerRight={section.headerRight}
            spacing="normal"
          >
            <DetailFieldGroup fields={section.fields} />
          </SectionContainer>
        ))}
      </div>
    );
  }

  // Legacy: render children directly
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  );
};

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
