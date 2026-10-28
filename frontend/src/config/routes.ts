/**
 * Application Routes Configuration
 */

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  ORDERS: '/orders',
  LABORATORY: '/laboratory',
  LAB_ALL_TESTS: '/lab/tests',
  PAYMENTS: '/payments',
  REPORTS: '/reports',
  CATALOG: '/catalog',
  EVENT_LOG: '/event-log',
  USERS: '/users',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
