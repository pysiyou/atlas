/** Auth login typography (isolated palette). */

export const AUTH_TYPE = {
  kicker: 'font-body text-auth-fg-light type-amount tracking-wider uppercase',
  lead: 'font-body type-page-title text-auth-fg-muted',
  featureTitle: 'font-body font-semibold text-auth-fg type-amount leading-tight',
  featureBody: 'font-body type-amount text-auth-fg-muted',
  footer: 'font-body type-amount text-auth-fg-muted',
  formSubtitle: 'font-body text-auth-fg-muted type-amount',
  formError: 'font-body type-amount text-auth-error-fg',
  fieldLabel: 'block font-body type-amount font-normal text-auth-fg-muted',
  formFooter: 'font-body text-center type-amount text-auth-fg-subtle',
  companySubtitle: 'font-body text-auth-fg-light type-body tracking-wider uppercase',
  mobileBrandTitle: 'font-display type-page-title text-auth-fg',
  brandingKicker:
    'font-body text-auth-fg-light type-amount tracking-widest uppercase mt-space-1',
  brandingLead: 'font-body type-page-title text-auth-fg-muted leading-relaxed max-w-md',
} as const;
