/**
 * Billing React Query hooks.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/store';
import { cacheConfig } from '@/lib/query';
import { billingAPI } from './billing.service';

export { billingAPI } from './billing.service';
export type { Invoice, InsuranceClaim, SubmitClaimRequest } from './billing.service';

export function useOrderInvoices(orderId: number | undefined) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const query = useQuery({
    queryKey: ['billing', 'invoices', orderId],
    queryFn: () => billingAPI.getInvoicesForOrder(orderId!),
    enabled: isAuthenticated && !isRestoring && orderId != null,
    ...cacheConfig.dynamic,
  });
  return {
    invoices: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useOrderInsuranceClaims(orderId: number | undefined) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const query = useQuery({
    queryKey: ['billing', 'claims', orderId],
    queryFn: () => billingAPI.getClaimsForOrder(orderId!),
    enabled: isAuthenticated && !isRestoring && orderId != null,
    ...cacheConfig.dynamic,
  });
  return {
    claims: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSubmitInsuranceClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: billingAPI.submitClaim,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['billing', 'claims', variables.orderId] });
    },
  });
}
