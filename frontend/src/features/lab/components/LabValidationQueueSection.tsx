/**
 * LabValidationQueueSection — section header + card grid matching LabWorkflowQueueLayout layout.
 */
import React, { type ReactNode } from 'react';
import { text } from '@/theme/recipes';

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
    <h3 className={`${text({ role: 'section-title' })} mb-space-4`}>
      {title}
      {typeof count === 'number' ? ` (${count})` : ''}
    </h3>
    <div className="grid gap-layout-section content-start">{children}</div>
  </section>
);
