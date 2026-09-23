/**
 * Dashboard Page
 * Reception/admin overview with real metrics (no stub data).
 */

import React from 'react';
import { useAuthStore } from '@/app/authStore';
import { usePatientNameLookup } from '@/features/patients';
import { formatDate } from '@/utils';
import { useDashboardSummary } from '../api/dashboard';
import { LabPipelineSummary } from '../components/LabPipelineSummary';
import { PendingCriticalValuesPanel } from '@/features/lab';
import {
  DashboardStatsGrid,
} from '../components/DashboardStatsGrid';
import { buildDashboardStats } from '../components/buildDashboardStats';
import { DashboardOrdersInProgressBanner } from '../components/DashboardOrdersInProgressBanner';
import { DashboardRecentOrders } from '../components/DashboardRecentOrders';
import { TYPE, WORKSPACE } from '@/components/theme/recipes';

export const Dashboard: React.FC = () => {
  const { user: currentUser, hasRole } = useAuthStore();
  const { summary } = useDashboardSummary();
  const { getPatientName } = usePatientNameLookup();

  const isLabRole = hasRole(['administrator', 'lab-technician', 'lab-technician-plus']);
  const isReceptionRole = hasRole(['administrator', 'receptionist']);

  const stats = buildDashboardStats({
    isReceptionRole,
    isLabRole,
    patientsCount: summary?.totalPatients ?? 0,
    todayPatients: summary?.todayPatients ?? 0,
    ordersCount: summary?.totalOrders ?? 0,
    todayOrders: summary?.todayOrders ?? 0,
    todayRevenue: summary?.todayRevenue ?? 0,
    pendingOrders: summary?.pendingOrders ?? 0,
  });

  const recentOrders = summary?.recentOrders ?? [];
  const pendingOrders = summary?.pendingOrders ?? 0;

  return (
    <div className={WORKSPACE.page}>
      <div className="shrink-0 h-14 min-h-14 max-h-14 flex flex-col justify-center">
        <h1 className={`${TYPE.pageTitle} font-bold truncate`}>
          Welcome back, {currentUser?.name}!
        </h1>
        <p className={`${TYPE.amount} text-text-secondary truncate`}>
          Here&apos;s what&apos;s happening today — {formatDate(new Date())}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-space-6">
          <DashboardStatsGrid stats={stats} />

          {isLabRole && <LabPipelineSummary />}
          {isLabRole && <PendingCriticalValuesPanel />}

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
