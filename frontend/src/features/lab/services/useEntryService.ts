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
      
      toast.success('Results saved successfully');
    } catch (error) {
      toast.error(`Failed to save results: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      
      toast.success('Results rejected');
    } catch (error) {
      toast.error(`Failed to reject results: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  return {
    enterResults,
    rejectResults,
  };
}
