/**
 * Dashboard Page
 * Reception/admin overview with real metrics (no stub data).
 */

import React from 'react';
import { useAuthStore } from '@/app/store';
import { usePatientNameLookup, usePatientsList } from '@/features/patients/api/usePatients';
import { useOrdersList } from '@/features/orders/api/useOrderQueries';
import { usePaymentsList } from '@/features/billing/api/usePayments';
import { formatDate } from '@/utils';
import { LabPipelineSummary } from './components/LabPipelineSummary';
import { CriticalValuesPanel } from '@/features/critical-values/components/CriticalValuesPanel';
import {
  DashboardStatsGrid,
} from './components/DashboardStatsGrid';
import { buildDashboardStats } from './components/buildDashboardStats';
import { DashboardOrdersInProgressBanner } from './components/DashboardOrdersInProgressBanner';
import { DashboardRecentOrders } from './components/DashboardRecentOrders';

export const Dashboard: React.FC = () => {
  const { user: currentUser, hasRole } = useAuthStore();
  const { patients } = usePatientsList();
  const { orders } = useOrdersList();
  const { payments } = usePaymentsList();
  const { getPatientName } = usePatientNameLookup();

  const isLabRole = hasRole(['administrator', 'lab-technician', 'lab-technician-plus']);
  const isReceptionRole = hasRole(['administrator', 'receptionist']);

  const today = new Date().toISOString().split('T')[0];
  const todayPatients = patients.filter(p => p.registrationDate.startsWith(today)).length;
  const todayOrders = orders.filter(o => o.orderDate.startsWith(today)).length;
  const todayRevenue = payments
    .filter(p => p.paidAt && p.paidAt.startsWith(today))
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingOrders = orders.filter(
    o => o.overallStatus === 'ordered' || o.overallStatus === 'in-progress'
  ).length;

  const stats = buildDashboardStats({
    isReceptionRole,
    isLabRole,
    patientsCount: patients.length,
    todayPatients,
    ordersCount: orders.length,
    todayOrders,
    todayRevenue,
    pendingOrders,
  });

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-full flex flex-col p-2 gap-2">
      <div className="shrink-0 h-14 min-h-14 max-h-14 flex flex-col justify-center">
        <h1 className="text-xl font-bold text-text-primary truncate">
          Welcome back, {currentUser?.name}!
        </h1>
        <p className="text-sm text-text-secondary truncate">
          Here&apos;s what&apos;s happening today — {formatDate(new Date())}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-6">
          <DashboardStatsGrid stats={stats} />

          {isLabRole && <LabPipelineSummary />}
          {isLabRole && <CriticalValuesPanel />}

          {pendingOrders > 0 && isReceptionRole && (
            <DashboardOrdersInProgressBanner pendingOrders={pendingOrders} />
          )}

          {isReceptionRole && (
            <DashboardRecentOrders orders={recentOrders} getPatientName={getPatientName} />
          )}
        </div>
      </div>
    </div>
  );
};
