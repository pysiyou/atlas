/**
 * Doctor approval control for requireDoctorApproval workflow.
 */

import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/primitives';
import { isWorkflowEnabled } from '@/config/clientConfig';
import { queryKeys } from '@/lib/query';
import { orderAPI } from '../api/orders';
import type { Order } from '@/types';
import { formatDateTime } from '@/utils/date';

export interface OrderDoctorApprovalControlProps {
  order: Order;
}

export const OrderDoctorApprovalControl: React.FC<OrderDoctorApprovalControlProps> = ({
  order,
}) => {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const enabled = isWorkflowEnabled('requireDoctorApproval');
  const approved = Boolean(order.doctorApprovedBy);
  const approvedAt = order.doctorApprovedAt;

  const handleApprove = useCallback(async () => {
    setSubmitting(true);
    try {
      await orderAPI.approveForCollection(String(order.orderId));
      await queryClient.invalidateQueries({
        queryKey: queryKeys.orders.byId(String(order.orderId)),
      });
    } finally {
      setSubmitting(false);
    }
  }, [order.orderId, queryClient]);

  if (!enabled) return null;

  if (approved) {
    return (
      <p className="text-sm text-text-secondary">
        Approved for collection
        {approvedAt ? ` · ${formatDateTime(approvedAt)}` : ''}
      </p>
    );
  }

  return (
    <Button
      type="button"
      variant="primary"
      size="sm"
      disabled={submitting}
      onClick={() => void handleApprove()}
    >
      {submitting ? 'Approving…' : 'Approve for collection'}
    </Button>
  );
};