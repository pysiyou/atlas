/**
 * Billing Feature — public API
 */

export {
  billingAPI,
  useOrderInvoices,
  useOrderInsuranceClaims,
  useSubmitInsuranceClaim,
} from './api/billing';
export type { Invoice, InvoiceItem, InsuranceClaim, SubmitClaimRequest } from './api/billing';

export { InsuranceClaimSection } from './InsuranceClaimSection';
export type { InsuranceClaimSectionProps } from './InsuranceClaimSection';
