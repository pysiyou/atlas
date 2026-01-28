/**
 * Central export for all pages
 */

// App-level pages (remain in /pages)
export { Dashboard as DashboardPage } from './DashboardPage';
export { Appointments as AppointmentsPage } from './AppointmentsPage';
export { Reports as ReportsPage } from './ReportsPage';
export { Admin as AdminPage } from './AdminPage';

// Feature pages (now in features)
export { PatientsPage } from '@/features/patient/pages';
export { OrdersPage } from '@/features/order/pages';
export { PaymentsPage } from '@/features/payment/pages';
export { CatalogPage } from '@/features/catalog/pages';
export { Laboratory as LaboratoryPage } from '@/features/lab/pages';
