/**
 * useLabMetrics Hook
 * Calculate lab analytics metrics from orders, samples, and test data
 */

import { useMemo } from 'react';
import { useOrdersList, useSamplesList, useUsersList } from '@/hooks/queries';
import { getResultRejectionType } from '@/types/order';
import type {
  LabAnalytics,
  TATMetrics,
  TATTrendPoint,
  VolumeMetrics,
  RejectionMetrics,
  CriticalValueMetrics,
  ProductivityMetrics,
  BacklogMetrics,
  FunnelMetrics,
  DateRangeFilter,
} from '../types';

/**
 * Calculate time difference in minutes between two ISO date strings
 */
const minutesBetween = (start: string | undefined, end: string | undefined): number => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
};

/** Filter orders by date range (order date) */
function filterOrdersByRange(orders: ReturnType<typeof useOrdersList>['orders'], range: DateRangeFilter | undefined) {
  if (!orders || !range) return orders ?? [];
  const start = new Date(range.startDate);
  const end = new Date(range.endDate);
  return orders.filter(order => {
    const orderDate = new Date(order.orderDate);
    return orderDate >= start && orderDate <= end;
  });
}

/** Filter samples by date range (createdAt) */
function filterSamplesByRange(samples: ReturnType<typeof useSamplesList>['samples'], range: DateRangeFilter | undefined) {
  if (!samples || !range) return samples ?? [];
  const start = new Date(range.startDate);
  const end = new Date(range.endDate);
  return samples.filter(sample => {
    const sampleDate = new Date(sample.createdAt);
    return sampleDate >= start && sampleDate <= end;
  });
}

/**
 * Main hook to calculate all lab metrics. Call twice with dateRange and comparisonDateRange
 * to get periodChange in the dashboard.
 */
export function useLabMetrics(dateRange?: DateRangeFilter) {
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { samples, isLoading: samplesLoading } = useSamplesList();
  const { users } = useUsersList();

  const isLoading = ordersLoading || samplesLoading;

  const filteredOrders = useMemo(
    () => filterOrdersByRange(orders, dateRange),
    [orders, dateRange]
  );
  const filteredSamples = useMemo(
    () => filterSamplesByRange(samples, dateRange),
    [samples, dateRange]
  );

  // Calculate TAT metrics
  const tatMetrics = useMemo((): TATMetrics => {
    if (!filteredOrders) {
      return {
        averageTAT: 0,
        medianTAT: 0,
        targetTAT: 240, // 4 hours default target
        complianceRate: 0,
        breakdown: { orderToCollection: 0, collectionToEntry: 0, entryToValidation: 0 },
      };
    }

    const tatTimes: number[] = [];
    const breakdowns = { orderToCollection: [] as number[], collectionToEntry: [] as number[], entryToValidation: [] as number[] };

    filteredOrders.forEach(order => {
      (order.tests ?? []).forEach(test => {
        if (test.resultValidatedAt) {
          // Total TAT
          const totalTAT = minutesBetween(order.orderDate, test.resultValidatedAt);
          tatTimes.push(totalTAT);

          // Breakdown (need sample data for accurate breakdown)
          const sample = filteredSamples?.find(s => s.sampleId === test.sampleId);
          if (sample && 'collectedAt' in sample && sample.collectedAt) {
            breakdowns.orderToCollection.push(minutesBetween(order.orderDate, sample.collectedAt));
            if (test.resultEnteredAt) {
              breakdowns.collectionToEntry.push(minutesBetween(sample.collectedAt, test.resultEnteredAt));
              breakdowns.entryToValidation.push(minutesBetween(test.resultEnteredAt, test.resultValidatedAt));
            }
          }
        }
      });
    });

    const averageTAT = tatTimes.length > 0 ? tatTimes.reduce((a, b) => a + b, 0) / tatTimes.length : 0;
    const sortedTAT = [...tatTimes].sort((a, b) => a - b);
    const medianTAT = sortedTAT.length > 0 ? sortedTAT[Math.floor(sortedTAT.length / 2)] : 0;
    const targetTAT = 240; // 4 hours
    const complianceRate = tatTimes.length > 0 ? (tatTimes.filter(t => t <= targetTAT).length / tatTimes.length) * 100 : 0;

    // Daily TAT/compliance for trend charts
    const dailyTAT: Record<string, number[]> = {};
    const dailyCompliance: Record<string, number> = {};
    filteredOrders.forEach(order => {
      (order.tests ?? []).forEach(test => {
        if (test.resultValidatedAt) {
          const totalTAT = minutesBetween(order.orderDate, test.resultValidatedAt);
          const dateKey = test.resultValidatedAt.split('T')[0];
          if (!dailyTAT[dateKey]) dailyTAT[dateKey] = [];
          dailyTAT[dateKey].push(totalTAT);
          dailyCompliance[dateKey] = (dailyCompliance[dateKey] ?? 0) + (totalTAT <= targetTAT ? 1 : 0);
        }
      });
    });
    const trend: TATTrendPoint[] = Object.entries(dailyTAT)
      .map(([date, times]) => ({
        date,
        averageTAT: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
        complianceRate: Math.round(((dailyCompliance[date] ?? 0) / times.length) * 100),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      averageTAT: Math.round(averageTAT),
      medianTAT: Math.round(medianTAT),
      targetTAT,
      complianceRate: Math.round(complianceRate),
      breakdown: {
        orderToCollection: breakdowns.orderToCollection.length > 0 ? Math.round(breakdowns.orderToCollection.reduce((a, b) => a + b, 0) / breakdowns.orderToCollection.length) : 0,
        collectionToEntry: breakdowns.collectionToEntry.length > 0 ? Math.round(breakdowns.collectionToEntry.reduce((a, b) => a + b, 0) / breakdowns.collectionToEntry.length) : 0,
        entryToValidation: breakdowns.entryToValidation.length > 0 ? Math.round(breakdowns.entryToValidation.reduce((a, b) => a + b, 0) / breakdowns.entryToValidation.length) : 0,
      },
      trend,
    };
  }, [filteredOrders, filteredSamples]);

  // Calculate volume metrics
  const volumeMetrics = useMemo((): VolumeMetrics => {
    if (!filteredOrders) {
      return { total: 0, byCategory: {}, byPriority: {}, trend: [] };
    }

    const allTests = filteredOrders.flatMap(o => o.tests);
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const dailyCounts: Record<string, number> = {};

    filteredOrders.forEach(order => {
      // Priority breakdown
      byPriority[order.priority] = (byPriority[order.priority] || 0) + (order.tests ?? []).length;

      // Daily trend
      const dateKey = order.orderDate.split('T')[0];
      dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + (order.tests ?? []).length;

      // Category breakdown (would need test catalog data for accurate category)
      (order.tests ?? []).forEach(_test => {
        const category = 'General'; // Placeholder - would need catalog lookup
        byCategory[category] = (byCategory[category] || 0) + 1;
      });
    });

    const trend = Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total: allTests.length,
      byCategory,
      byPriority,
      trend,
    };
  }, [filteredOrders]);

  // Calculate rejection metrics
  const rejectionMetrics = useMemo((): RejectionMetrics => {
    if (!filteredSamples || !filteredOrders) {
      return {
        sampleRejections: { total: 0, rate: 0, topReasons: [] },
        resultRejections: { total: 0, rate: 0, retestCount: 0, recollectCount: 0 },
      };
    }

    // Sample rejections
    const rejectedSamples = filteredSamples.filter(s => s.status === 'rejected');
    const sampleRejectionReasons: Record<string, number> = {};
    
    rejectedSamples.forEach(sample => {
      if ('rejectionReasons' in sample && sample.rejectionReasons) {
        sample.rejectionReasons.forEach(reason => {
          sampleRejectionReasons[reason] = (sampleRejectionReasons[reason] || 0) + 1;
        });
      }
    });

    const topSampleReasons = Object.entries(sampleRejectionReasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Result rejections
    let retestCount = 0;
    let recollectCount = 0;
    
    filteredOrders.forEach(order => {
      (order.tests ?? []).forEach(test => {
        if (test.resultRejectionHistory && test.resultRejectionHistory.length > 0) {
          test.resultRejectionHistory.forEach(rejection => {
            const rt = getResultRejectionType(rejection);
            if (rt === 're-test') retestCount++;
            if (rt === 're-collect') recollectCount++;
          });
        }
      });
    });

    return {
      sampleRejections: {
        total: rejectedSamples.length,
        rate: filteredSamples.length > 0 ? (rejectedSamples.length / filteredSamples.length) * 100 : 0,
        topReasons: topSampleReasons,
      },
      resultRejections: {
        total: retestCount + recollectCount,
        rate: volumeMetrics.total > 0 ? ((retestCount + recollectCount) / volumeMetrics.total) * 100 : 0,
        retestCount,
        recollectCount,
      },
    };
  }, [filteredSamples, filteredOrders, volumeMetrics.total]);

  // Calculate critical value metrics
  const criticalValueMetrics = useMemo((): CriticalValueMetrics => {
    if (!filteredOrders) {
      return { total: 0, acknowledged: 0, pending: 0, averageResponseTime: 0, byTest: [] };
    }

    let total = 0;
    let acknowledged = 0;
    const responseTimes: number[] = [];
    const testCounts: Record<string, { testName: string; count: number }> = {};

    filteredOrders.forEach(order => {
      (order.tests ?? []).forEach(test => {
        if (test.hasCriticalValues) {
          total++;
          testCounts[test.testCode] = {
            testName: test.testName,
            count: (testCounts[test.testCode]?.count || 0) + 1,
          };

          if (test.criticalAcknowledgedAt) {
            acknowledged++;
            if (test.criticalNotifiedAt) {
              const responseTime = minutesBetween(test.criticalNotifiedAt, test.criticalAcknowledgedAt);
              responseTimes.push(responseTime);
            }
          }
        }
      });
    });

    const averageResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    const byTest = Object.entries(testCounts)
      .map(([testCode, data]) => ({ testCode, testName: data.testName, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total,
      acknowledged,
      pending: total - acknowledged,
      averageResponseTime,
      byTest,
    };
  }, [filteredOrders]);

  // Calculate productivity metrics
  const productivityMetrics = useMemo((): ProductivityMetrics => {
    if (!filteredOrders || !users) {
      return { totalResultsEntered: 0, totalValidations: 0, byTechnician: [] };
    }

    const technicianStats: Record<number, { resultsEntered: number; validations: number }> = {};

    filteredOrders.forEach(order => {
      (order.tests ?? []).forEach(test => {
        if (test.enteredBy) {
          const userId = typeof test.enteredBy === 'string' ? parseInt(test.enteredBy) : test.enteredBy;
          if (!technicianStats[userId]) {
            technicianStats[userId] = { resultsEntered: 0, validations: 0 };
          }
          technicianStats[userId].resultsEntered++;
        }
        if (test.validatedBy) {
          const userId = typeof test.validatedBy === 'string' ? parseInt(test.validatedBy) : test.validatedBy;
          if (!technicianStats[userId]) {
            technicianStats[userId] = { resultsEntered: 0, validations: 0 };
          }
          technicianStats[userId].validations++;
        }
      });
    });

    const byTechnician = Object.entries(technicianStats).map(([userId, stats]) => {
      const userIdNum = parseInt(userId);
      const user = users.find(u => Number(u.id) === userIdNum);
      return {
        userId: userIdNum,
        userName: user?.name || `User ${userId}`,
        resultsEntered: stats.resultsEntered,
        validations: stats.validations,
      };
    }).sort((a, b) => (b.resultsEntered + b.validations) - (a.resultsEntered + a.validations));

    const totalResultsEntered = byTechnician.reduce((sum, t) => sum + t.resultsEntered, 0);
    const totalValidations = byTechnician.reduce((sum, t) => sum + t.validations, 0);

    return {
      totalResultsEntered,
      totalValidations,
      byTechnician,
    };
  }, [filteredOrders, users]);

  // Calculate backlog metrics
  const backlogMetrics = useMemo((): BacklogMetrics => {
    if (!filteredSamples || !filteredOrders) {
      return {
        pendingCollection: 0,
        pendingEntry: 0,
        pendingValidation: 0,
        oldestPending: {},
      };
    }

    const pendingCollection = filteredSamples.filter(s => s.status === 'pending').length;
    
    let pendingEntry = 0;
    let pendingValidation = 0;
    let oldestEntry: string | undefined;
    let oldestValidation: string | undefined;

    filteredOrders.forEach(order => {
      (order.tests ?? []).forEach(test => {
        if (test.status === 'sample-collected') {
          pendingEntry++;
          const sample = filteredSamples.find(s => s.sampleId === test.sampleId);
          if (sample && 'collectedAt' in sample && sample.collectedAt && (!oldestEntry || sample.collectedAt < oldestEntry)) {
            oldestEntry = sample.collectedAt;
          }
        }
        if (test.status === 'resulted' || test.status === 'in-progress') {
          pendingValidation++;
          if (test.resultEnteredAt && (!oldestValidation || test.resultEnteredAt < oldestValidation)) {
            oldestValidation = test.resultEnteredAt;
          }
        }
      });
    });

    const oldestPendingSample = filteredSamples
      .filter(s => s.status === 'pending')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];

    return {
      pendingCollection,
      pendingEntry,
      pendingValidation,
      oldestPending: {
        collection: oldestPendingSample?.createdAt,
        entry: oldestEntry,
        validation: oldestValidation,
      },
    };
  }, [filteredSamples, filteredOrders]);

  // Funnel: orders → collected → entered → validated (counts by stage)
  const funnelMetrics = useMemo((): FunnelMetrics => {
    if (!filteredOrders) return { orders: 0, collected: 0, entered: 0, validated: 0 };
    let ordersCount = 0;
    let collected = 0;
    let entered = 0;
    let validated = 0;
    filteredOrders.forEach(order => {
      ordersCount++;
      (order.tests ?? []).forEach(test => {
        const sample = filteredSamples?.find(s => s.sampleId === test.sampleId);
        const isCollected = sample && 'collectedAt' in sample && sample.collectedAt;
        if (isCollected) collected++;
        if (test.resultEnteredAt) entered++;
        if (test.resultValidatedAt) validated++;
      });
    });
    return { orders: ordersCount, collected, entered, validated };
  }, [filteredOrders, filteredSamples]);

  // Combine all metrics
  const analytics: LabAnalytics = useMemo(() => ({
    tat: tatMetrics,
    volume: volumeMetrics,
    rejections: rejectionMetrics,
    criticalValues: criticalValueMetrics,
    productivity: productivityMetrics,
    backlog: backlogMetrics,
    funnel: funnelMetrics,
    generatedAt: new Date().toISOString(),
  }), [tatMetrics, volumeMetrics, rejectionMetrics, criticalValueMetrics, productivityMetrics, backlogMetrics, funnelMetrics]);

  return {
    analytics,
    isLoading,
  };
}
