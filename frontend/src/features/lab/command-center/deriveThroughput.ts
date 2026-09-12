import { isToday, isValid, parseISO } from 'date-fns';
import type { TodayThroughput } from './boardTypes';

function isSameLocalDay(iso: string | undefined | null): boolean {
  if (!iso) return false;
  const date = parseISO(iso);
  return isValid(date) && isToday(date);
}

interface OrderInput {
  createdAt?: string;
  orderDate?: string;
  updatedAt?: string;
  overallStatus?: string;
  tests?: Array<{
    resultEnteredAt?: string | null;
    resultValidatedAt?: string | null;
    status?: string;
  }>;
}

interface SampleInput {
  status: string;
  collectedAt?: string | null;
  rejectedAt?: string | null;
}

export function deriveTodayThroughput(
  orders: OrderInput[],
  samples: SampleInput[],
): TodayThroughput {
  let validatedToday = 0;
  let resultsEnteredToday = 0;
  let ordersCompletedToday = 0;
  let ordersCreatedToday = 0;

  for (const order of orders) {
    if (isSameLocalDay(order.createdAt) || isSameLocalDay(order.orderDate)) {
      ordersCreatedToday += 1;
    }
    if (order.overallStatus === 'completed' && isSameLocalDay(order.updatedAt)) {
      ordersCompletedToday += 1;
    }
    for (const test of order.tests ?? []) {
      if (isSameLocalDay(test.resultEnteredAt)) resultsEnteredToday += 1;
      if (test.status === 'validated' && isSameLocalDay(test.resultValidatedAt)) {
        validatedToday += 1;
      }
    }
  }

  const collectedToday = samples.filter(
    sample => sample.status === 'collected' && isSameLocalDay(sample.collectedAt),
  ).length;

  const rejectedToday = samples.filter(
    sample => sample.status === 'rejected' && isSameLocalDay(sample.rejectedAt),
  ).length;

  return {
    validated: validatedToday,
    collected: collectedToday,
    resultsEntered: resultsEnteredToday,
    ordersCompleted: ordersCompletedToday,
    rejected: rejectedToday,
    ordersCreated: ordersCreatedToday,
  };
}
