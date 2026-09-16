/**
 * LabValidationQueueSection — section header + card grid matching LabWorkflowQueueLayout layout.
 */
import React, { type ReactNode } from 'react';
import { LAB_CARD_TYPOGRAPHY } from '../utils/labStyles';

interface LabValidationQueueSectionProps {
  title: string;
  count?: number;
  children: ReactNode;
  className?: string;
}

export const LabValidationQueueSection: React.FC<LabValidationQueueSectionProps> = ({
  title,
  count,
  children,
  className = '',
}) => (
  <section className={className}>
    <h3 className={`${LAB_CARD_TYPOGRAPHY.sectionTitle} mb-4`}>
      {title}
      {typeof count === 'number' ? ` (${count})` : ''}
    </h3>
    <div className="grid gap-4 content-start">{children}</div>
  </section>
);
