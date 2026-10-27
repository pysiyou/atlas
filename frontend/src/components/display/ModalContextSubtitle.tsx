/**
 * Second line of modal chrome — primary context label, order id, optional badges.
 */

import type { ReactNode } from 'react';
import { CodeText } from '@/components/display/CodeText';
import { displayId } from '@/utils';

export interface ModalContextSubtitleProps {
  /** Patient name, test name, or other primary context for this modal. */
  label: ReactNode;
  orderId?: number | string | null;
  patientId?: number | string | null;
  badges?: ReactNode;
}

function formatRecordId(
  type: 'order' | 'patient',
  id: number | string
): string {
  const numeric = typeof id === 'string' ? Number(id) : id;
  return displayId[type](numeric);
}

export function ModalContextSubtitle({ label, orderId, patientId, badges }: ModalContextSubtitleProps) {
  const showOrderId = orderId != null && orderId !== '';
  const showPatientId = patientId != null && patientId !== '';
  const showBadges = badges != null && badges !== false;
  const labelTitle = typeof label === 'string' ? label : undefined;

  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-space-2 overflow-hidden">
      <span className="min-w-0 shrink truncate" title={labelTitle}>
        {label}
      </span>
      {showOrderId ? (
        <>
          <span className="shrink-0 text-text-tertiary" aria-hidden="true">-</span>
          <CodeText className="shrink-0">{formatRecordId('order', orderId)}</CodeText>
        </>
      ) : null}
      {showPatientId ? (
        <>
          <span className="shrink-0 text-text-tertiary" aria-hidden="true">-</span>
          <CodeText className="shrink-0">{formatRecordId('patient', patientId)}</CodeText>
        </>
      ) : null}
      {showBadges ? (
        <>
          <span className="shrink-0 text-text-tertiary" aria-hidden="true">-</span>
          <span className="inline-flex shrink-0 items-center gap-space-1">{badges}</span>
        </>
      ) : null}
    </span>
  );
}
