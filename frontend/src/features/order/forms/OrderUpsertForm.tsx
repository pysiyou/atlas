/**
 * OrderUpsertForm - MIGRATION IN PROGRESS
 * 
 * NOTE: useOrderController has been removed as part of V2 architecture migration.
 * This component needs full migration to use React Hook Form + Zod + useOrderService.
 * 
 * TODO: Implement with new patterns
 */

import React from 'react';
import type { Order } from '@/types';

export interface OrderUpsertFormProps {
  isModal?: boolean;
  onClose?: () => void;
  initialPatientId?: string;
  mode?: 'create' | 'edit';
  order?: Order;
}

export const OrderUpsertForm: React.FC<OrderUpsertFormProps> = ({
  isModal: _isModal,
  onClose: _onClose,
  initialPatientId: _initialPatientId,
  mode,
  order: _order,
}) => {
  return (
    <div className="p-6">
      <p className="text-text-tertiary">
        Order form migration in progress ({mode} mode).
      </p>
      <p className="text-sm text-text-tertiary mt-2">
        Use useOrderService for new implementations.
      </p>
    </div>
  );
};
