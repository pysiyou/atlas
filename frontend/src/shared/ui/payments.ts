/** Payment status and payment methods → badge color */
import type { BadgeColor } from './types';

export const PAYMENT_COLOR_MAP: Record<string, BadgeColor> = {
  partial: 'warning',
  paid: 'success',
  unpaid: 'danger',
  cash: 'success',
  'credit-card': 'info',
  'debit-card': 'indigo',
  insurance: 'purple',
  'bank-transfer': 'cyan',
  'mobile-money': 'teal',
};
