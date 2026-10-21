/**
 * Patient, test name, and IDs — one wrapping row; cards hide secondary fields at narrow widths.
 */

import React from 'react';
import { EntityId } from '@/components/display';
import { IdentityInline, type IdentitySegment } from '@/components/layout';
import { formatDate } from '@/utils';

export interface LabIdentityContext {
  patientName?: string;
  patientId?: number;
  orderId: number;
  orderTestId?: number;
  sampleId?: number;
  entityCode?: string;
  entityName?: string;
  referringPhysician?: string;
  patientDob?: string;
}

interface LabIdentityRowProps {
  context: LabIdentityContext;
  className?: string;
  compact?: boolean;
}

export const LabIdentityRow: React.FC<LabIdentityRowProps> = ({
  context,
  className,
  compact = false,
}) => {
  const idClass = 'whitespace-nowrap';
  const hideMd = compact ? ('md' as const) : undefined;
  const hideLg = compact ? ('lg' as const) : undefined;

  const segments: IdentitySegment[] = [];

  if (context.patientName) {
    segments.push({
      kind: 'text',
      key: 'patient',
      text: context.patientName,
      emphasis: 'primary',
      truncate: compact,
    });
  }
  if (context.entityName) {
    segments.push({
      kind: 'text',
      key: 'entityName',
      text: context.entityName,
      emphasis: 'primary',
      capitalize: false,
      truncate: compact,
    });
  }

  segments.push({
    kind: 'node',
    key: 'ord',
    node: <EntityId type="order" value={context.orderId} className={idClass} />,
  });

  if (context.orderTestId != null) {
    segments.push({
      kind: 'node',
      key: 'tst',
      node: <EntityId type="orderTest" value={context.orderTestId} className={idClass} />,
      hideBelow: hideMd,
    });
  }
  if (context.sampleId != null) {
    segments.push({
      kind: 'node',
      key: 'sam',
      node: <EntityId type="sample" value={context.sampleId} className={idClass} />,
      hideBelow: hideMd,
    });
  }
  if (context.entityCode) {
    segments.push({
      kind: 'node',
      key: 'code',
      node: <EntityId className={idClass}>{context.entityCode}</EntityId>,
      hideBelow: context.entityName ? hideLg : hideMd,
    });
  }
  if (context.patientDob) {
    segments.push({
      kind: 'text',
      key: 'dob',
      text: `DOB ${formatDate(context.patientDob)}`,
      hideBelow: hideLg,
    });
  }
  if (context.referringPhysician) {
    segments.push({
      kind: 'text',
      key: 'phys',
      text: context.referringPhysician,
      emphasis: 'primary',
      truncate: true,
      hideBelow: hideLg,
    });
  }

  return (
    <IdentityInline
      className={className}
      nowrap={compact}
      segments={segments}
    />
  );
};
