import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderFormSchema, orderSchema, type Order } from '../schemas/order.schema';
import { apiClient } from '@/services/api/client';
import { queryKeys } from '@/lib/query/keys';
import toast from 'react-hot-toast';

export function useOrderService() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (input: unknown) => {
      const validated = orderFormSchema.parse(input);
      const response = await apiClient.post<Order>('/orders', {
        ...validated,
        tests: validated.testCodes.map(code => ({ testCode: code })),
      });
      return orderSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      toast.success('Order created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: unknown }) => {
      const validated = orderFormSchema.partial().parse(data);
      const response = await apiClient.put<Order>(`/orders/${id}`, validated);
      return orderSchema.parse(response);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(String(id)) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      toast.success('Order updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Business logic
  const calculateTotalPrice = (tests: Array<{ priceAtOrder: number }>) => {
    return tests.reduce((sum, test) => sum + test.priceAtOrder, 0);
  };

  return { create, update, calculateTotalPrice };
}
