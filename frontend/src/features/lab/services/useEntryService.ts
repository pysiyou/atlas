/**
 * useEntryService Hook
 * 
 * Business logic for result entry workflow
 */

import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import toast from 'react-hot-toast';
import { resultAPI } from '@/services/api';
// Entry service for result entry workflow

export function useEntryService() {
  const queryClient = useQueryClient();

  /**
   * Enter results for a test
   */
  const enterResults = async (
    orderId: string | number,
    testCode: string,
    results: Record<string, unknown>,
    technicianNotes?: string
  ) => {
    try {
      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      await resultAPI.enterResults(orderIdStr, testCode, {
        results,
        technicianNotes,
      });
      
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(orderIdStr) });
      
      toast.success({
        title: 'Results saved successfully',
        subtitle: 'The results have been saved and the order has been updated. You can continue with other tests.',
      });
    } catch (error) {
      toast.error({
        title: `Failed to save results: ${error instanceof Error ? error.message : 'Unknown error'}`,
        subtitle: 'The results could not be saved. Check your connection and the entered values, then try again.',
      });
      throw error;
    }
  };

  /**
   * Reject results during entry (if needed)
   */
  const rejectResults = async (
    orderId: string | number,
    testCode: string,
    rejectionReason: string,
    rejectionType: 're-test' | 're-collect'
  ) => {
    try {
      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      await resultAPI.rejectResults(orderIdStr, testCode, {
        rejectionReason,
        rejectionType,
      });
      
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(orderIdStr) });
      
      toast.success({
        title: 'Results rejected',
        subtitle: 'The results have been rejected. A re-test or new sample may have been requested as selected.',
      });
    } catch (error) {
      toast.error({
        title: `Failed to reject results: ${error instanceof Error ? error.message : 'Unknown error'}`,
        subtitle: 'The rejection could not be saved. Please try again or check the test status.',
      });
      throw error;
    }
  };

  return {
    enterResults,
    rejectResults,
  };
}
