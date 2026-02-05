/**
 * useOrderForm Hook
 * 
 * Manages order form state, validation, and submission using React Hook Form + Zod
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useRef } from 'react';
import { orderFormSchema, type OrderFormInput } from '../schemas/order.schema';
import { useOrderService } from '../services/useOrderService';
import type { Order } from '@/types';

interface UseOrderFormOptions {
  order?: Order;
  mode?: 'create' | 'edit';
  initialPatientId?: number;
  onSubmitSuccess?: (createdOrder?: Order) => void | Promise<void>;
}

/**
 * Hook for managing order form state and submission
 */
export function useOrderForm({ order, mode = 'create', initialPatientId, onSubmitSuccess }: UseOrderFormOptions = {}) {
  const { create, update } = useOrderService();
  const isSubmittingRef = useRef(false);

  const defaultValues = useMemo(() => {
    if (mode === 'edit' && order) {
      return {
        patientId: order.patientId,
        referringPhysician: order.referringPhysician,
        priority: order.priority,
        clinicalNotes: order.clinicalNotes || '',
        testCodes: order.tests.map(t => t.testCode),
        paymentMethod: undefined, // Payment method not stored on order
      } as Partial<OrderFormInput>;
    }
    if (mode === 'create') {
      return {
        patientId: initialPatientId,
        priority: 'low' as const, // Default priority
      } as Partial<OrderFormInput>;
    }
    return {};
  }, [mode, order, initialPatientId]);

  const form = useForm<OrderFormInput>({
    resolver: zodResolver(orderFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const onSubmit = async (data: OrderFormInput) => {
    // Prevent double submission using ref guard
    if (isSubmittingRef.current || create.isPending || update.isPending) {
      return;
    }

    isSubmittingRef.current = true;
    try {
      let createdOrder: Order | undefined;
      if (mode === 'edit' && order) {
        await update.mutateAsync({ id: order.orderId, data });
      } else {
        createdOrder = await create.mutateAsync(data);
      }
      form.reset();
      await onSubmitSuccess?.(createdOrder);
    } catch (error) {
      // Error handled by service hook
      console.error('Form submission error:', error);
      throw error;
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return {
    ...form,
    handleSubmit: form.handleSubmit(onSubmit),
    isSubmitting: create.isPending || update.isPending,
    mode,
  };
}
