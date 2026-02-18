/**
 * usePatientContextList — Superset enrichment hook for patient list views.
 *
 * Joins cached Patient[] + Order[] to produce PatientContext[],
 * pre-computing order statistics so PatientList and PatientTableConfig
 * don't need to do inline joins.
 *
 * No new API calls — uses existing React Query caches.
 * Consumers: PatientList, PatientTableConfig
 */

import { useMemo } from 'react';
import { usePatientsList } from './usePatients';
import { useOrdersList } from '@/features/orders/api/useOrderQueries';
import type { PatientContext } from '@/types';

export function usePatientContextList(): {
  patients: PatientContext[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { patients: rawPatients, isLoading: pLoading, isError: pError, refetch } = usePatientsList();
  const { orders, isLoading: oLoading } = useOrdersList();

  const patients = useMemo<PatientContext[]>(() => {
    if (!rawPatients || !orders) return [];

    // Group orders by patientId for O(n) lookup
    const ordersByPatient = new Map<number, typeof orders>();
    for (const order of orders) {
      const pid = order.patientId;
      if (!ordersByPatient.has(pid)) ordersByPatient.set(pid, []);
      ordersByPatient.get(pid)!.push(order);
    }

    return rawPatients.map(patient => {
      const patientOrders = ordersByPatient.get(patient.id) ?? [];

      // Sort descending by orderDate to find the most recent
      const sorted = [...patientOrders].sort(
        (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
      );
      const lastOrder = sorted[0];

      const hasUnpaidOrders = patientOrders.some(
        o => o.paymentStatus === 'unpaid' || o.paymentStatus === 'partial'
      );

      return {
        ...patient,
        orderCount: patientOrders.length,
        lastOrderDate: lastOrder?.orderDate,
        lastOrderStatus: lastOrder?.overallStatus,
        hasUnpaidOrders,
      } satisfies PatientContext;
    });
  }, [rawPatients, orders]);

  return {
    patients,
    isLoading: pLoading || oLoading,
    isError: pError,
    refetch,
  };
}
