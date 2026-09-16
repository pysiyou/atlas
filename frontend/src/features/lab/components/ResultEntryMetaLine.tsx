/**
 * Result entry metadata line (who entered values, when).
 */

import React from 'react';
import { LabAuditLineView } from './LabWorkflowHeader';

interface ResultEntryMetaLineProps {
  enteredAt?: string;
  enteredBy?: string;
  className?: string;
}

export const ResultEntryMetaLine: React.FC<ResultEntryMetaLineProps> = ({
  enteredAt,
  enteredBy,
  className,
}) => {
  if (!enteredAt) return null;

  return (
    <LabAuditLineView
      line={{ type: 'result-entered', enteredAt, enteredBy }}
      className={className}
    />
  );
};
