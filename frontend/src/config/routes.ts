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
  PAYMENTS: '/payments',
  REPORTS: '/reports',
  CATALOG: '/catalog',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
