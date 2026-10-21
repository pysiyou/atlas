/** Promo / sign-in surface typography. */

export const PROMO_TYPE = {
  kicker: 'font-body text-promo-fg-light type-amount tracking-wider uppercase',
  lead: 'font-body type-page-title text-promo-fg-muted',
  featureTitle: 'font-body font-semibold text-promo-fg type-amount leading-tight',
  featureBody: 'font-body type-amount text-promo-fg-muted',
  footer: 'font-body type-amount text-promo-fg-muted',
  formSubtitle: 'font-body text-promo-fg-muted type-amount',
  formError: 'font-body type-amount text-promo-error-fg',
  fieldLabel: 'block font-body type-amount font-normal text-promo-fg-muted',
  formFooter: 'font-body text-center type-amount text-promo-fg-subtle',
  companySubtitle: 'font-body text-promo-fg-light type-body tracking-wider uppercase',
  mobileBrandTitle: 'font-display type-page-title text-promo-fg',
  brandingKicker:
    'font-body text-promo-fg-light type-amount tracking-widest uppercase mt-space-1',
  brandingLead: 'font-body type-page-title text-promo-fg-muted leading-relaxed max-w-md',
} as const;
