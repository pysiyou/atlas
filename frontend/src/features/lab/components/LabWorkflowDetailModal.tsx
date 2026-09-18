/**
 * LabWorkflowDetailModal - Shared modal structure for lab workflow detail views
 *
 * Provides consistent structure for SampleDetail, ResultDetail, and ValidationDetail:
 * - Header with badges
 * - Patient/Order context section
 * - Flexible content sections
 * - Action footer
 */

import React, { type ReactNode } from 'react';
import { Modal, Panel, DetailFieldGroup, FooterInfo, DialogFooter } from '@/components';
import { MODULE_ICONS } from '@/config/icons';
import type { DetailFieldConfig } from '@/components';
import { LAB_MODAL_DETAIL } from '../utils/labStyles';
import { LabModalHeader, type LabWorkflowModalContext, type LabAuditLine } from './LabWorkflowHeader';
import { TYPE } from '@/components/theme/recipes';


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
  contextInfo: LabWorkflowModalContext;
  /** Structured audit lines (collection, entry, recollection, etc.) */
  headerAudit?: LabAuditLine[];
  /** Main content sections */
  children: ReactNode;
  /** Footer actions */
  footer?: ReactNode;
  /** Footer info icon and text (defaults to lab workflow) */
  footerInfo?: ReactNode;
  /** When true, prevents closing via header close button, backdrop click, or Escape (e.g. while saving) */
  disableClose?: boolean;
}

/**
 * LabWorkflowDetailModal provides the shared structure for all lab detail modals
 */
export const LabWorkflowDetailModal: React.FC<LabDetailModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  modalKey,
  headerBadges,
  contextInfo,
  headerAudit,
  children,
  footer,
  footerInfo,
  disableClose = false,
}) => {
  return (
    <Modal
      key={modalKey}
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size="3xl"
      disableClose={disableClose}
    >
      <div className="flex flex-col h-full bg-surface-page">
        <div className={`flex-1 overflow-y-auto p-space-6 ${LAB_MODAL_DETAIL.sectionStack}`}>
          <LabModalHeader
            badges={headerBadges}
            contextInfo={contextInfo}
            auditLines={headerAudit}
          />
          {children}
        </div>

        {/* Footer */}
        {(footer || footerInfo) && (
          <DialogFooter
            start={footerInfo || <FooterInfo icon={MODULE_ICONS.laboratory} label="Laboratory" size="md" />}
            end={footer}
          />
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
  headerEnd?: ReactNode;
}

/**
 * DetailGrid - Two-column grid for detail sections
 *
 * Can be used in two ways:
 * 1. With children (legacy): Pass Panel components as children
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
 *   <Panel variant="lab" title="Section 1">...</Panel>
 *   <Panel variant="lab" title="Section 2">...</Panel>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-layout-section">
        {visibleSections.map(section => (
          <Panel
            key={section.title}
            variant="lab"
            title={section.title}
            headerEnd={section.headerEnd}
          >
            <DetailFieldGroup fields={section.fields} spacing="tight" />
          </Panel>
        ))}
      </div>
    );
  }

  // Legacy: render children directly
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-layout-section">{children}</div>;
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
  statusClassName = 'text-text-tertiary',
  children,
}) => {
  const hasStatus = Boolean(statusIcon || statusMessage);

  return (
    <div
      className={`flex items-center w-full ${hasStatus ? 'justify-between' : 'justify-end'}`}
    >
      {hasStatus &&
        (statusIcon && statusMessage ? (
          <div className={`${TYPE.meta} flex items-center gap-1.5`}>
            <div className="w-3.5 h-3.5 flex items-center justify-center">{statusIcon}</div>
            <span>{statusMessage}</span>
          </div>
        ) : (
          <div className={`flex items-center gap-1.5 text-xs ${statusClassName}`}>
            {statusIcon && (
              <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">{statusIcon}</div>
            )}
            {statusMessage && <span>{statusMessage}</span>}
          </div>
        ))}
      <div className="flex items-center gap-3 flex-nowrap">{children}</div>
    </div>
  );
};
