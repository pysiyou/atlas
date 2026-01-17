/**
 * Routes Configuration - Single Source of Truth
 * All application routes defined in one place
 */

export const ROUTES = {
  // Public routes
  LOGIN: '/login',

  // Main navigation routes
  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  ORDERS: '/orders',
  LABORATORY: '/laboratory',
  APPOINTMENTS: '/appointments',
  BILLING: '/billing',
  REPORTS: '/reports',
  ADMIN: '/admin',

  // Patient sub-routes
  PATIENT_NEW: '/patients/new',
  PATIENT_DETAIL: (id: string) => `/patients/${id}`,
  PATIENT_EDIT: (id: string) => `/patients/${id}/edit`,

  // Order sub-routes
  ORDER_NEW: '/orders/new',
  ORDER_DETAIL: (id: string) => `/orders/${id}`,

  // Default redirects
  HOME: '/',
  DEFAULT: '/login',
} as const;

/**
 * Route labels for display
 */
export const ROUTE_LABELS: Record<string, string> = {
  [ROUTES.DASHBOARD]: 'Dashboard',
  [ROUTES.PATIENTS]: 'Patients',
  [ROUTES.ORDERS]: 'Orders',
  [ROUTES.LABORATORY]: 'Laboratory',
  [ROUTES.APPOINTMENTS]: 'Appointments',
  [ROUTES.BILLING]: 'Billing',
  [ROUTES.REPORTS]: 'Reports',
  [ROUTES.ADMIN]: 'Admin',
};
