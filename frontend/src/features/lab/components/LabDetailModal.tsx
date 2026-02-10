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
import { Modal } from '@/shared/ui';
import { Badge, SectionContainer, DetailFieldGroup, FooterInfo } from '@/shared/ui';
import { ICONS } from '@/utils';
import type { DetailFieldConfig } from '@/shared/ui';
import { formatDate } from '@/utils';
import { displayId } from '@/utils';
import { useUserLookup } from '@/hooks/queries';

interface ContextInfo {
  patientName: string;
  patientId: string | number;
  orderId: string | number;
  referringPhysician?: string;
  /** Patient date of birth for additional identification */
  patientDob?: string;
}

interface SampleInfo {
  sampleId: string | number;
  collectedAt?: string;
  collectedBy?: string;
}

interface LabDetailModalProps {
  /** Modal open state */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title (e.g., sample ID or test name) */
  title: string | React.ReactNode;
  /** Modal subtitle (e.g., patient name - sample type) */
  subtitle: string | React.ReactNode;
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
  /** Footer info icon and text (defaults to lab workflow) */
  footerInfo?: ReactNode;
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
  footerInfo,
}) => {
  const { getUserName } = useUserLookup();

  return (
    <Modal
      key={modalKey}
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size="3xl"
    >
      <div className="flex flex-col h-full bg-canvas">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Header Section with Badges and Context */}
          <SectionContainer hideHeader>
            <div className="flex flex-col gap-4">
              {/* Row 1: Badges */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 flex-wrap">{headerBadges}</div>
              </div>

              {/* Row 2: Patient & Order context */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3 text-sm text-fg-muted flex-wrap">
                  <span className="font-normal text-fg">{contextInfo.patientName}</span>
                  <span className="text-fg-disabled select-none">|</span>
                  <span className="font-normal text-brand text-xs font-mono tracking-wide whitespace-nowrap">
                    {typeof contextInfo.patientId === 'number'
                      ? displayId.patient(contextInfo.patientId)
                      : contextInfo.patientId}
                  </span>
                  {contextInfo.patientDob && (
                    <>
                      <span className="text-fg-disabled select-none">|</span>
                      <span className="text-xs text-fg-subtle whitespace-nowrap">
                        DOB: {formatDate(contextInfo.patientDob)}
                      </span>
                    </>
                  )}
                  <span className="text-fg-disabled select-none">|</span>
                  <span className="font-normal text-brand text-xs font-mono tracking-wide whitespace-nowrap">
                    {typeof contextInfo.orderId === 'number'
                      ? displayId.order(contextInfo.orderId)
                      : contextInfo.orderId}
                  </span>
                  {contextInfo.referringPhysician && (
                    <>
                      <span className="text-fg-disabled select-none">|</span>
                      <span className="text-fg-subtle whitespace-nowrap">{contextInfo.referringPhysician}</span>
                    </>
                  )}
                </div>

                {/* Collection info */}
                {sampleInfo && sampleInfo.collectedAt && (
                  <span className="text-xs text-fg-subtle">
                    Sample{' '}
                    <span className="font-normal text-brand text-xs font-mono tracking-wide">
                      {typeof sampleInfo.sampleId === 'number'
                        ? displayId.sample(sampleInfo.sampleId)
                        : sampleInfo.sampleId}
                    </span>{' '}
                    collected{' '}
                    <span className="text-fg-muted">{formatDate(sampleInfo.collectedAt)}</span>
                    {sampleInfo.collectedBy && (
                      <span> by {getUserName(sampleInfo.collectedBy)}</span>
                    )}
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
        {(footer || footerInfo) && (
          <div className="shrink-0 bg-panel border-t border-stroke px-6 py-4 flex items-center justify-between">
            {footerInfo || <FooterInfo icon={ICONS.dataFields.flask} text="Lab workflow" />}
            {footer}
          </div>
        )}
      </div>
    </Modal>
  );
};

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
 * 1. With children (legacy): Pass SectionContainer components as children
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
 *   <SectionContainer title="Section 1">...</SectionContainer>
 *   <SectionContainer title="Section 2">...</SectionContainer>
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
        {visibleSections.map(section => (
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
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
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
  statusClassName = 'text-fg-subtle',
  children,
}) => (
  <div className="flex items-center justify-between">
    {statusIcon && statusMessage ? (
      <div className="text-xs text-fg-subtle flex items-center gap-1.5">
        <div className="w-3.5 h-3.5 flex items-center justify-center">{statusIcon}</div>
        <span>{statusMessage}</span>
      </div>
    ) : (
      <div className={`flex items-center gap-2 text-sm ${statusClassName}`}>
        {statusIcon}
        {statusMessage && <span>{statusMessage}</span>}
      </div>
    )}
    <div className="flex items-center gap-3">{children}</div>
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
