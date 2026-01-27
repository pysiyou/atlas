import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentFormSchema, paymentSchema, type Payment } from '../schemas/payment.schema';
import { apiClient } from '@/services/api/client';
import { queryKeys } from '@/lib/query/keys';
import toast from 'react-hot-toast';

export function usePaymentService() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (input: unknown) => {
      const validated = paymentFormSchema.parse(input);
      const response = await apiClient.post<Payment>('/payments', validated);
      return paymentSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      toast.success('Payment processed successfully');
    },
    onError: (error) => {
      toast.error(`Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  return { create };
}
