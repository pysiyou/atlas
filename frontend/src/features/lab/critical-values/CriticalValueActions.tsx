/**
 * CriticalValueActions - Notify and acknowledge critical lab results.
 */

import React, { useState } from 'react';
import { Alert, Button, Badge } from '@/components';
import { formatDate } from '@/utils';
import { displayId } from '@/utils';
import { useAuthStore } from '@/app/store';
import { toast } from '@/app/AppToastBar';
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
      toast.error({ title: 'Recipient required', subtitle: 'Enter who was notified.' });
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
      toast.success({ title: 'Notification recorded', subtitle: record.testCode });
      onUpdated?.();
    } catch {
      toast.error({ title: 'Failed to record notification' });
    }
  };

  const handleAcknowledge = async () => {
    if (!user?.name) return;
    try {
      await acknowledgeMutation.mutateAsync({
        testId: record.id,
        body: {
          acknowledgedBy: user.name,
          notes: notes.trim() || undefined,
        },
      });
      toast.success({ title: 'Critical value acknowledged', subtitle: record.testCode });
      onUpdated?.();
    } catch {
      toast.error({ title: 'Failed to acknowledge critical value' });
    }
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="entity-id">{displayId.orderTest(record.id)}</span>
        <Badge variant="danger" size="xs">
          {record.testCode}
        </Badge>
        <span className="text-text-secondary">{record.patientName}</span>
        <span className="entity-id entity-id--secondary">{displayId.order(record.orderId)}</span>
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
          {record.criticalNotifiedAt ? ` on ${formatDate(record.criticalNotifiedAt)}` : ''}
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
          Acknowledged {formatDate(record.criticalAcknowledgedAt)}
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
