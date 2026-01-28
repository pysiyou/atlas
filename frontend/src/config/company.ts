/**
 * Company Configuration
 * Centralized company-specific data configuration for multi-tenant support
 */

import companyConfigData from '../data/company-config.json';

/**
 * Company configuration type definitions
 */
export interface CompanyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  fullAddress?: string;
}

export interface CompanyContact {
  address: CompanyAddress;
  phone: string | string[];
  email: string;
  website: string;
}

export interface CompanyBranding {
  logoPath: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface CompanyFeature {
  title: string;
  description: string;
}

export interface CompanyReports {
  headerText: string;
  footerText: string;
  includeSignature: boolean;
}

export interface TrustIndicator {
  text: string;
  count: string;
  audience: string;
}

export interface CompanyMarketing {
  trustIndicator: TrustIndicator;
}

export interface CompanyData {
  company: {
    name: string;
    subtitle: string;
    fullName: string;
    displayName: string;
    tagline: string;
    version: string;
    copyright: string;
  };
  branding: CompanyBranding;
  contact: CompanyContact;
  features: CompanyFeature[];
  reports: CompanyReports;
  marketing: CompanyMarketing;
}

/**
 * Company configuration singleton
 * Loads company data from JSON file (will be replaced with database fetch later)
 */
class CompanyConfig {
  private config: CompanyData;

  constructor() {
    this.config = companyConfigData as CompanyData;
  }

  /**
   * Get full company configuration
   */
  getConfig(): CompanyData {
    return this.config;
  }

  /**
   * Get company name
   */
  getName(): string {
    return this.config.company.name;
  }

  /**
   * Get full company name
   */
  getFullName(): string {
    return this.config.company.fullName;
  }

  /**
   * Get display name
   */
  getDisplayName(): string {
    return this.config.company.displayName;
  }

  /**
   * Get company tagline
   */
  getTagline(): string {
    return this.config.company.tagline;
  }

  /**
   * Get app version
   */
  getVersion(): string {
    return this.config.company.version;
  }

  /**
   * Get copyright text
   */
  getCopyright(): string {
    return this.config.company.copyright;
  }

  /**
   * Get branding configuration
   */
  getBranding(): CompanyBranding {
    return this.config.branding;
  }

  /**
   * Get contact information
   */
  getContact(): CompanyContact {
    return this.config.contact;
  }

  /**
   * Get feature list
   */
  getFeatures(): CompanyFeature[] {
    return this.config.features;
  }

  /**
   * Get report configuration
   */
  getReports(): CompanyReports {
    return this.config.reports;
  }

  /**
   * Get marketing data
   */
  getMarketing(): CompanyMarketing {
    return this.config.marketing;
  }
}

/**
 * Singleton instance of company configuration
 */
export const companyConfig = new CompanyConfig();
