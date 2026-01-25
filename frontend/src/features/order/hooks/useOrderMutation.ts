/**
 * Order Mutation Hook
 * Handles order create and update operations with validation and error handling
 */

import { useAuth } from '@/hooks';
import { useCreateOrder, useUpdateOrder } from '@/hooks/queries';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';
import { displayId } from '@/utils/id-display';
import type { Order } from '@/types';
import type { OrderFormData } from '../types/orderForm';
import { buildNewOrderPayload, buildUpdatedOrderPayload } from '../utils/orderPayloadBuilder';
import type { Patient, Test } from '@/types';

export interface UseOrderMutationProps {
  existingOrder?: Order;
  onSuccess?: () => void;
}

export interface UseOrderMutationReturn {
  isSubmitting: boolean;
  handleCreateOrder: (
    formData: OrderFormData,
    selectedPatient: Patient,
    activeTests: Test[]
  ) => Promise<Order>;
  handleUpdateOrder: (
    formData: OrderFormData,
    activeTests: Test[]
  ) => Promise<Order>;
}

/**
 * Hook for handling order creation and updates
 */
export const useOrderMutation = ({
  existingOrder,
  onSuccess,
}: UseOrderMutationProps): UseOrderMutationReturn => {
  const { currentUser } = useAuth();
  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder();

  /**
   * Gets the current user ID as a number
   */
  const getCurrentUserId = (): number => {
    return typeof currentUser?.id === 'string'
      ? parseInt(currentUser.id, 10)
      : currentUser?.id || 0;
  };

  /**
   * Handles order creation
   */
  const handleCreateOrder = async (
    formData: OrderFormData,
    selectedPatient: Patient,
    activeTests: Test[]
  ): Promise<Order> => {
    try {
      const newOrder = buildNewOrderPayload(
        formData,
        selectedPatient,
        activeTests,
        getCurrentUserId()
      );
      const createdOrder = await createOrderMutation.mutateAsync(newOrder as Order);
      toast.success(`Order ${displayId.order(createdOrder.orderId)} created successfully!`);
      onSuccess?.();
      return createdOrder;
    } catch (error) {
      logger.error('Error creating order', error instanceof Error ? error : undefined);
      toast.error('Failed to create order');
      throw error;
    }
  };

  /**
   * Handles order update
   */
  const handleUpdateOrder = async (
    formData: OrderFormData,
    activeTests: Test[]
  ): Promise<Order> => {
    if (!existingOrder) {
      toast.error('Missing order data for edit');
      throw new Error('Missing order data for edit');
    }

    try {
      const updatedOrder = buildUpdatedOrderPayload(formData, existingOrder, activeTests);
      const result = await updateOrderMutation.mutateAsync({
        orderId: existingOrder.orderId,
        updates: updatedOrder as Partial<Order>,
      });

      toast.success(`Order ${displayId.order(existingOrder.orderId)} updated successfully`);
      onSuccess?.();
      return result;
    } catch (error) {
      logger.error('Error updating order', error instanceof Error ? error : undefined);
      toast.error('Failed to update order');
      throw error;
    }
  };

  return {
    isSubmitting: createOrderMutation.isPending || updateOrderMutation.isPending,
    handleCreateOrder,
    handleUpdateOrder,
  };
};
