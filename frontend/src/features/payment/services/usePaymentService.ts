import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentFormSchema, paymentSchema, type Payment } from '../schemas/payment.schema';
import { apiClient } from '@/services/api/client';
import { queryKeys } from '@/lib/query/keys';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHelpers';

export function usePaymentService() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (input: unknown) => {
      const validated = paymentFormSchema.parse(input);
      // API expects orderId as number, schema transforms string to number
      const response = await apiClient.post<Payment>('/payments', validated);
      return paymentSchema.parse(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      const orderIdStr = typeof data.orderId === 'string' ? data.orderId : String(data.orderId);
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.byOrder(orderIdStr) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      toast.success('Payment processed successfully');
    },
    onError: (error) => {
      toast.error(`Failed to process payment: ${getErrorMessage(error, 'Unknown error')}`);
    },
  });

  return { create };
}
