/**
 * Shared layout for lab workflow detail modals — shell, field grid, footer, stage subtitle.
 */

import React, { type ReactNode } from 'react';
import { Modal, Panel, DetailFieldGroup, FooterInfo, DialogFooter } from '@/components';
import { MODULE_ICONS } from '@/config/icons';
import type { DetailFieldConfig } from '@/components';
import { useUserLookup } from '@/lib/api/users';
import { LAB_MODAL_DETAIL } from '../utils/labStyles';
import {
  LabHeaderCompactContext,
  LabModalHeader,
  type LabWorkflowModalContext,
  type LabAuditLine,
} from '../components/LabWorkflowHeader';
import { DETAIL_TYPE, TYPE } from '@/components/theme/recipes';
import { LAB_COPY, labStageLabel, type LabWorkflowStage } from '../constants/labConstants';

export interface QueueModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  subtitle: string | React.ReactNode;
  modalKey?: string;
  headerBadges: ReactNode;
  headerMeta?: ReactNode;
  contextInfo?: LabWorkflowModalContext;
  headerAudit?: LabAuditLine[];
  /** Replaces LabModalHeader (sample collection modal). */
  headerLeftColumn?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  footerInfo?: ReactNode;
  disableClose?: boolean;
}

export const QueueModalShell: React.FC<QueueModalShellProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  modalKey,
  headerBadges,
  headerMeta,
  contextInfo,
  headerAudit,
  headerLeftColumn,
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
      badges={
        headerBadges ? (
          <LabHeaderCompactContext.Provider value={false}>
            {headerBadges}
          </LabHeaderCompactContext.Provider>
        ) : undefined
      }
      size="3xl"
      disableClose={disableClose}
    >
      <div className="flex flex-col h-full bg-surface-page">
        <div className={`flex-1 overflow-y-auto p-space-6 ${LAB_MODAL_DETAIL.sectionStack}`}>
          {headerLeftColumn ? (
            <header className="min-w-0 w-full">{headerLeftColumn}</header>
          ) : contextInfo ? (
            <LabModalHeader
              alerts={headerMeta}
              contextInfo={contextInfo}
              auditLines={headerAudit}
            />
          ) : null}
          {children}
        </div>

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

export interface DetailGridSectionConfig {
  title: string;
  fields: DetailFieldConfig[];
  headerEnd?: ReactNode;
}

interface DetailGridProps {
  children?: ReactNode;
  sections?: DetailGridSectionConfig[];
}

export const DetailGrid: React.FC<DetailGridProps> = ({ children, sections }) => {
  const { getUserName } = useUserLookup();

  if (sections && sections.length > 0) {
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
            <DetailFieldGroup fields={section.fields} spacing="tight" resolveUserDisplay={getUserName} />
          </Panel>
        ))}
      </div>
    );
  }

  return <div className="grid grid-cols-1 md:grid-cols-2 gap-layout-section">{children}</div>;
};

interface ModalFooterProps {
  statusIcon?: ReactNode;
  statusMessage: string;
  statusClassName?: string;
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
          <div className={`${DETAIL_TYPE.meta} flex items-center gap-space-1-5`}>
            <div className="w-3.5 h-3.5 flex items-center justify-center">{statusIcon}</div>
            <span>{statusMessage}</span>
          </div>
        ) : (
          <div className={`flex items-center gap-space-1-5 ${TYPE.value} ${statusClassName}`}>
            {statusIcon && (
              <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">{statusIcon}</div>
            )}
            {statusMessage && <span>{statusMessage}</span>}
          </div>
        ))}
      <div className="flex items-center gap-space-3 flex-nowrap">{children}</div>
    </div>
  );
};

export type LabModalStage = LabWorkflowStage | 'escalation';

export function labModalStageLabel(stage: LabModalStage): string {
  return stage === 'escalation' ? LAB_COPY.workflow.escalation : labStageLabel(stage, 'full');
}

export function labModalSubtitle(stage: LabModalStage): React.ReactNode {
  return (
    <span className={`${TYPE.caption} uppercase tracking-widest font-light`}>
      {labModalStageLabel(stage)}
    </span>
  );
}
