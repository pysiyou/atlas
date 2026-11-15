/**
 * Read-only views over loaded client-config (for auth chrome, PDF, sidebar).
 */
import type { ClientConfig } from './types';
import defaultClientConfig from '../../../config/client-config.json';
import { getClientConfig } from './client';

/** Cached API config, or repo `client-config.json` when load has not run or failed. */
export function getEffectiveClientConfig(): ClientConfig {
  return (getClientConfig() ?? defaultClientConfig) as ClientConfig;
}

export interface BrandingFeatureBullet {
  title: string;
  description: string;
}

export interface TrustIndicatorView {
  text: string;
  count: string;
  audience: string;
}

export interface BrandingPresentationView {
  company: {
    name: string;
    displayName: string;
    fullName: string;
    subtitle: string;
    tagline: string;
    version: string;
    copyright: string;
  };
  branding: ClientConfig['branding'] & { appNamePart2Start?: number };
  contact: {
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      fullAddress: string;
    };
    phone: string | string[];
    email: string;
    website: string;
  };
  features: BrandingFeatureBullet[];
  reports: {
    headerText: string;
    footerText: string;
    includeSignature: boolean;
  };
  marketing: { trustIndicator?: TrustIndicatorView };
}

export function getBrandingPresentation(): BrandingPresentationView {
  const c = getEffectiveClientConfig();
  const address = c.company.contact?.address;
  const marketingFeatures = c.marketing?.features;

  return {
    company: {
      name: c.company.name,
      displayName: c.company.displayName,
      fullName: c.company.fullName ?? c.company.displayName,
      subtitle: c.company.subtitle ?? '',
      tagline: c.company.tagline ?? '',
      version: c.company.version ?? '',
      copyright: c.company.copyright ?? '',
    },
    branding: {
      ...c.branding,
      secondaryColor: c.branding.secondaryColor ?? c.branding.primaryColor,
    },
    contact: {
      address: {
        street: address?.street ?? '',
        city: address?.city ?? '',
        state: address?.state ?? '',
        zipCode: address?.zipCode ?? '',
        country: address?.country ?? '',
        fullAddress: address?.fullAddress ?? '',
      },
      phone: c.company.contact?.phone ?? [],
      email: c.company.contact?.email ?? '',
      website: c.company.contact?.website ?? '',
    },
    features:
      marketingFeatures?.map(title => ({ title, description: '' })) ?? [],
    reports: {
      headerText: c.reports?.headerText ?? '',
      footerText: c.reports?.footerText ?? '',
      includeSignature: c.reports?.includeSignature === true,
    },
    marketing: {
      ...(c.marketing?.trustIndicator
        ? { trustIndicator: { ...c.marketing.trustIndicator } }
        : {}),
    },
  };
}

export function getCompanyName(): string {
  return getEffectiveClientConfig().company.name;
}

export function getCompanyFullName(): string {
  const c = getEffectiveClientConfig().company;
  return c.fullName ?? c.displayName;
}

export function getReportPdfMeta(): { name: string; headerText: string; footerText: string } {
  const c = getEffectiveClientConfig();
  return {
    name: getCompanyFullName(),
    headerText: c.reports?.headerText ?? '',
    footerText: c.reports?.footerText ?? '',
  };
}