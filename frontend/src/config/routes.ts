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
  APPOINTMENTS: '/appointments',
  BILLING: '/billing',
  PAYMENTS: '/payments',
  REPORTS: '/reports',
  ADMIN: '/admin',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
