/**
 * CriticalValueActions - Notify and acknowledge critical lab results.
 */

import React, { useState } from 'react';
import { Alert, Button, Badge, EntityId } from '@/components';
import { formatDateTime } from '@/utils';
import { useAuthStore } from '@/app/authStore';
import { notify } from '@/utils/feedback';
import {
  useAcknowledgeCriticalValue,
  useNotifyCriticalValue,
} from './useCriticalValues';
import type { CriticalValueRecord } from './criticalValues.api';
import { inputBase } from '@/components/inputs/inputStyles';

interface CriticalValueActionsProps {
  record: CriticalValueRecord;
  compact?: boolean;
  onUpdated?: () => void;
}

export const CriticalValueActions: React.FC<CriticalValueActionsProps> = ({
  record,
  compact = false,
  onUpdated,
}) => {
  const { user } = useAuthStore();
  const notifyMutation = useNotifyCriticalValue();
  const acknowledgeMutation = useAcknowledgeCriticalValue();
  const [notifiedTo, setNotifiedTo] = useState('');
  const [notes, setNotes] = useState('');

  const isBusy = notifyMutation.isPending || acknowledgeMutation.isPending;

  const handleNotify = async () => {
    if (!notifiedTo.trim()) {
      notify.toast('lab.critical.recipientRequired');
      return;
    }
    try {
      await notifyMutation.mutateAsync({
        testId: record.id,
        body: {
          notifiedTo: notifiedTo.trim(),
          notificationMethod: 'phone',
          notes: notes.trim() || undefined,
        },
      });
      notify.toast('lab.critical.notify.success', { subtitle: record.testCode });
      onUpdated?.();
    } catch (error) {
      notify.apiError('lab.critical.notify.error', error);
    }
  };

  const handleAcknowledge = async () => {
    if (!user?.name) {
      notify.toast('lab.critical.profileMissing');
      return;
    }
    try {
      await acknowledgeMutation.mutateAsync({
        testId: record.id,
        body: {
          acknowledgedBy: user.name,
          notes: notes.trim() || undefined,
        },
      });
      notify.toast('lab.critical.ack.success', { subtitle: record.testCode });
      onUpdated?.();
    } catch (error) {
      notify.apiError('lab.critical.ack.error', error);
    }
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <EntityId type="orderTest" value={record.id} />
        <Badge variant="danger" size="xs">
          {record.testCode}
        </Badge>
        <span className="text-text-secondary">{record.patientName}</span>
        <EntityId type="order" value={record.orderId} variant="secondary" />
      </div>

      {record.flags && record.flags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {record.flags.map(flag => (
            <Badge key={flag} variant="danger" size="xs">
              {flag}
            </Badge>
          ))}
        </div>
      )}

      {record.criticalNotificationSent ? (
        <Alert variant="warning" className="text-xs">
          Notified {record.criticalNotifiedTo ? `to ${record.criticalNotifiedTo}` : ''}
          {record.criticalNotifiedAt ? ` on ${formatDateTime(record.criticalNotifiedAt)}` : ''}
        </Alert>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={notifiedTo}
            onChange={e => setNotifiedTo(e.target.value)}
            placeholder="Notified to (physician / department)"
            className={inputBase}
            disabled={isBusy}
          />
          <Button variant="primary" size="sm" onClick={handleNotify} isLoading={notifyMutation.isPending}>
            Record Notification
          </Button>
        </div>
      )}

      {record.criticalNotificationSent && !record.criticalAcknowledgedAt && (
        <Button variant="approve" size="sm" onClick={handleAcknowledge} isLoading={acknowledgeMutation.isPending}>
          Acknowledge
        </Button>
      )}

      {record.criticalAcknowledgedAt && (
        <p className="text-xs text-success-fg">
          Acknowledged {formatDateTime(record.criticalAcknowledgedAt)}
        </p>
      )}

      {!compact && (
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Optional notes"
          rows={2}
          className={`${inputBase} resize-none`}
          disabled={isBusy}
        />
      )}
    </div>
  );
};
