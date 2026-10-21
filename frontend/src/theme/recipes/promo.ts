/** Promo / sign-in surface typography. */

import { text } from './cva/text';

const uiMd = text({ role: 'amount' });
const pageTitle = text({ role: 'title-page' });
const body = text({ role: 'body' });

export const PROMO_TYPE = {
  kicker: `font-body text-promo-fg-light ${uiMd} tracking-wider uppercase`,
  lead: `font-body ${pageTitle} text-promo-fg-muted`,
  featureTitle: `font-body font-semibold text-promo-fg ${uiMd} leading-tight`,
  featureBody: `font-body ${uiMd} text-promo-fg-muted`,
  footer: `font-body ${uiMd} text-promo-fg-muted`,
  formSubtitle: `font-body text-promo-fg-muted ${uiMd}`,
  formError: `font-body ${uiMd} text-promo-error-fg`,
  fieldLabel: `block font-body ${uiMd} font-normal text-promo-fg-muted`,
  formFooter: `font-body text-center ${uiMd} text-promo-fg-subtle`,
  companySubtitle: `font-body text-promo-fg-light ${body} tracking-wider uppercase`,
  mobileBrandTitle: `font-display ${pageTitle} text-promo-fg`,
  brandingKicker: `font-body text-promo-fg-light ${uiMd} tracking-widest uppercase mt-space-1`,
  brandingLead: `font-body ${pageTitle} text-promo-fg-muted leading-relaxed max-w-md`,
} as const;
