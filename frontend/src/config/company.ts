/**
 * Company Configuration Facade
 * 
 * Thin facade over API-loaded client configuration (ClientConfig).
 * Maintains backward compatibility with existing call sites while reading
 * from the single source of truth: config/client-config.json via API.
 * 
 * Note: For non-React modules (PDF utils), ensure config is loaded before calling.
 */

import { getClientConfig } from './clientConfig';

/**
 * Company configuration type definitions (legacy compatibility)
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
  /** Character index at which to split displayName for two-tone header (e.g. 3 for "FIN" + "TRACKR"). Omit for single-style name. */
  appNamePart2Start?: number;
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
  trustIndicator?: TrustIndicator;
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
 * Default values when config is not yet loaded or fields are missing
 */
const DEFAULT_VALUES = {
  name: 'Atlas Lab',
  displayName: 'Atlas Lab',
  fullName: 'Atlas Clinical Laboratories',
  subtitle: 'Laboratory Information System',
  tagline: 'Excellence in Diagnostic Testing',
  version: '2.0',
  copyright: '© 2026 Atlas Clinical Labs. All rights reserved.',
  logoPath: '/icons/here.svg',
  primaryColor: '#0284c7',
  secondaryColor: '#38bdf8',
  headerText: 'Laboratory Report',
  footerText: 'This report contains confidential patient information.',
  includeSignature: true,
};

/**
 * Company configuration facade
 * Reads from API-loaded ClientConfig instead of bundled JSON
 */
class CompanyConfig {
  /**
   * Get full company configuration (legacy format)
   */
  getConfig(): CompanyData {
    const config = getClientConfig();
    
    if (!config) {
      console.warn('Client config not loaded yet, returning defaults');
    }
    
    return {
      company: {
        name: config?.company.name || DEFAULT_VALUES.name,
        subtitle: config?.company.subtitle || DEFAULT_VALUES.subtitle,
        fullName: config?.company.fullName || DEFAULT_VALUES.fullName,
        displayName: config?.company.displayName || DEFAULT_VALUES.displayName,
        tagline: config?.company.tagline || DEFAULT_VALUES.tagline,
        version: config?.company.version || DEFAULT_VALUES.version,
        copyright: config?.company.copyright || DEFAULT_VALUES.copyright,
      },
      branding: {
        logoPath: config?.branding.logoPath || DEFAULT_VALUES.logoPath,
        primaryColor: config?.branding.primaryColor || DEFAULT_VALUES.primaryColor,
        secondaryColor: config?.branding.secondaryColor || DEFAULT_VALUES.secondaryColor,
      },
      contact: this._getContact(config),
      features: this._getFeatures(config),
      reports: this._getReports(config),
      marketing: this._getMarketing(config),
    };
  }

  /**
   * Get company name
   */
  getName(): string {
    const config = getClientConfig();
    return config?.company.name || DEFAULT_VALUES.name;
  }

  /**
   * Get full company name
   */
  getFullName(): string {
    const config = getClientConfig();
    return config?.company.fullName || DEFAULT_VALUES.fullName;
  }

  /**
   * Get display name
   */
  getDisplayName(): string {
    const config = getClientConfig();
    return config?.company.displayName || DEFAULT_VALUES.displayName;
  }

  /**
   * Get company tagline
   */
  getTagline(): string {
    const config = getClientConfig();
    return config?.company.tagline || DEFAULT_VALUES.tagline;
  }

  /**
   * Get app version
   */
  getVersion(): string {
    const config = getClientConfig();
    return config?.company.version || DEFAULT_VALUES.version;
  }

  /**
   * Get copyright text
   */
  getCopyright(): string {
    const config = getClientConfig();
    return config?.company.copyright || DEFAULT_VALUES.copyright;
  }

  /**
   * Get branding configuration
   */
  getBranding(): CompanyBranding {
    const config = getClientConfig();
    return {
      logoPath: config?.branding.logoPath || DEFAULT_VALUES.logoPath,
      primaryColor: config?.branding.primaryColor || DEFAULT_VALUES.primaryColor,
      secondaryColor: config?.branding.secondaryColor || DEFAULT_VALUES.secondaryColor,
    };
  }

  /**
   * Get contact information
   */
  getContact(): CompanyContact {
    const config = getClientConfig();
    return this._getContact(config);
  }

  /**
   * Get feature list (for login marketing)
   */
  getFeatures(): CompanyFeature[] {
    const config = getClientConfig();
    return this._getFeatures(config);
  }

  /**
   * Get report configuration
   */
  getReports(): CompanyReports {
    const config = getClientConfig();
    return this._getReports(config);
  }

  /**
   * Get marketing data
   */
  getMarketing(): CompanyMarketing {
    const config = getClientConfig();
    return this._getMarketing(config);
  }

  // Private helpers to transform API config to legacy format
  
  private _getContact(config: ReturnType<typeof getClientConfig>): CompanyContact {
    const address = config?.company.contact?.address;
    return {
      address: {
        street: address?.street || '',
        city: address?.city || '',
        state: address?.state || '',
        zipCode: address?.zipCode || '',
        country: address?.country || '',
        fullAddress: address?.fullAddress || '',
      },
      phone: config?.company.contact?.phone || [],
      email: config?.company.contact?.email || '',
      website: config?.company.contact?.website || '',
    };
  }

  private _getFeatures(config: ReturnType<typeof getClientConfig>): CompanyFeature[] {
    // If marketing.features exists, convert string array to CompanyFeature format
    if (config?.marketing?.features) {
      return config.marketing.features.map(feature => ({
        title: feature,
        description: '',
      }));
    }
    
    // Return default features
    return [
      {
        title: 'Intelligent Patient Management',
        description: 'Unified records, appointments, and complete medical history at your fingertips',
      },
      {
        title: 'Streamlined Lab Workflows',
        description: 'From sample collection to result delivery — optimized every step of the way',
      },
      {
        title: 'Real-time Quality Control',
        description: 'Instant validation, automated alerts, and comprehensive audit trails',
      },
    ];
  }

  private _getReports(config: ReturnType<typeof getClientConfig>): CompanyReports {
    return {
      headerText: config?.reports?.headerText || DEFAULT_VALUES.headerText,
      footerText: config?.reports?.footerText || DEFAULT_VALUES.footerText,
      includeSignature: config?.reports?.includeSignature ?? DEFAULT_VALUES.includeSignature,
    };
  }

  private _getMarketing(config: ReturnType<typeof getClientConfig>): CompanyMarketing {
    // Return empty marketing object if not configured
    // Can be extended when marketing data is needed
    return {};
  }
}

/**
 * Singleton instance of company configuration facade
 */
export const companyConfig = new CompanyConfig();
