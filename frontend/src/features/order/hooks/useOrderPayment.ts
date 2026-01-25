/**
 * useOrderPayment
 *
 * Payment method state and processPayment for order create flow.
 * Used only when mode === 'create'.
 */

import { useMemo, useState } from 'react';
import { useInvalidateOrders, useInvalidatePayments } from '@/hooks/queries';
import { createPayment, type PaymentCreate } from '@/services/api/payments';
import {
  getDefaultPaymentMethod,
  getEnabledPaymentMethods,
  type PaymentMethod,
  type PaymentMethodOption,
} from '@/types/billing';

export interface UseOrderPaymentArgs {
  totalPrice: number;
}

export interface UseOrderPaymentReturn {
  paymentMethods: PaymentMethodOption[];
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  paymentError: string | null;
  setPaymentError: (message: string | null) => void;
  processPayment: (orderId: number) => Promise<void>;
}

export function useOrderPayment({
  totalPrice,
}: UseOrderPaymentArgs): UseOrderPaymentReturn {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() =>
    getDefaultPaymentMethod()
  );
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const { invalidateAll: invalidateOrders } = useInvalidateOrders();
  const { invalidateAll: invalidatePayments } = useInvalidatePayments();

  const paymentMethods = useMemo(() => getEnabledPaymentMethods(), []);

  const processPayment = async (orderId: number): Promise<void> => {
    if (totalPrice <= 0) return;
    const paymentData: PaymentCreate = {
      orderId,
      amount: totalPrice,
      paymentMethod,
      notes: undefined,
    };
    await createPayment(paymentData);
    await invalidatePayments();
    await invalidateOrders();
  };

  return {
    paymentMethods,
    paymentMethod,
    setPaymentMethod,
    paymentError,
    setPaymentError,
    processPayment,
  };
}
