/**
 * Dashboard Page
 * Reception/admin overview with real metrics (no stub data).
 */

import React from 'react';
import { useAuthStore } from '@/app/authStore';
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
import { SkeletonCard } from '@/components/loaders';
import { PageHeader } from '@/components/layout';
import { WORKSPACE } from '@/components/theme/recipes';

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-space-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-1 gap-space-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
      <SkeletonCard />
    </div>
  );
}

export const Dashboard: React.FC = () => {
  const { user: currentUser, hasRole } = useAuthStore();
  const { summary, isLoading } = useDashboardSummary();
  const showInitialLoad = isLoading && summary == null;

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
      <PageHeader
        variant="bar"
        title={`Welcome back, ${currentUser?.name}!`}
        subtitle={`Here's what's happening today — ${formatDate(new Date())}`}
      />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-space-6">
          {showInitialLoad ? (
            <DashboardLoadingSkeleton />
          ) : (
            <>
          <DashboardStatsGrid stats={stats} />

          {isLabRole && <LabPipelineSummary />}
          {isLabRole && <PendingCriticalValuesPanel />}

          {pendingOrders > 0 && isReceptionRole && (
            <DashboardOrdersInProgressBanner pendingOrders={pendingOrders} />
          )}

          {isReceptionRole && (
            <DashboardRecentOrders orders={recentOrders} />
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
