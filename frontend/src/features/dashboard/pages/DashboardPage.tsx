/**
 * Dashboard Page
 * Reception/admin overview with real metrics (no stub data).
 */

import React from 'react';
import { useAuthStore } from '@/app/authStore';
import { formatDate } from '@/utils';
import { useDashboardSummary } from '../api/dashboard';
import { LabPipelineSummary } from '../components/LabPipelineSummary';
import { PendingCriticalValuesPanel } from '@/features/lab/cross';
import { DashboardStatsGrid } from '../components/DashboardStatsGrid';
import { buildDashboardStats } from '../components/buildDashboardStats';
import { DashboardOrdersInProgressBanner } from '../components/DashboardOrdersInProgressBanner';
import { DashboardRecentOrders } from '../components/DashboardRecentOrders';
import { PageHeader } from '@/components/layout';
import { WORKSPACE } from '@/theme/recipes';

export const Dashboard: React.FC = () => {
  const { user: currentUser, hasRole } = useAuthStore();
  const { summary, isLoading } = useDashboardSummary();
  const loading = isLoading && summary == null;

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
  const skeletonStatCount = (isReceptionRole ? 3 : 0) + (isLabRole ? 1 : 0);

  return (
    <div className={WORKSPACE.page}>
      <PageHeader
        variant="bar"
        title={`Welcome back, ${currentUser?.name}!`}
        subtitle={`Here's what's happening today — ${formatDate(new Date())}`}
      />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-space-6">
          <DashboardStatsGrid
            stats={stats}
            loading={loading}
            skeletonStatCount={skeletonStatCount}
          />

          {isLabRole && <LabPipelineSummary loading={loading} />}
          {isLabRole && <PendingCriticalValuesPanel />}

          {isReceptionRole && (
            <DashboardOrdersInProgressBanner pendingOrders={pendingOrders} loading={loading} />
          )}

          {isReceptionRole && (
            <DashboardRecentOrders orders={recentOrders} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
};
