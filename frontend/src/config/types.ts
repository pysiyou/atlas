/** GENERATED — DO NOT EDIT. Source: config/client-config.schema.json */

/**
 * White-label configuration for Atlas LIS deployments
 */
export interface ClientConfig {
  company: {
    /**
     * Short company name
     */
    name: string;
    /**
     * Display name shown in UI
     */
    displayName: string;
    /**
     * Full legal company name
     */
    fullName?: string;
    /**
     * Company subtitle or slogan
     */
    subtitle?: string;
    /**
     * Marketing tagline
     */
    tagline?: string;
    /**
     * Application version
     */
    version?: string;
    /**
     * Copyright notice
     */
    copyright?: string;
    /**
     * Contact information
     */
    contact?: {
      address?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
        fullAddress?: string;
      };
      /**
       * Contact phone numbers
       */
      phone?: string[];
      /**
       * Contact email address
       */
      email?: string;
      /**
       * Company website
       */
      website?: string;
    };
  };
  branding: {
    /**
     * Optional favicon path (defaults to logoPath when omitted)
     */
    faviconPath?: string;
    /**
     * Path to company logo (relative to public directory or icon registry)
     */
    logoPath: string;
    /**
     * Primary brand color (hex format)
     */
    primaryColor: string;
    /**
     * Secondary brand color (hex format)
     */
    secondaryColor?: string;
    /**
     * Default theme to apply on startup
     */
    defaultTheme?:
      "studio-light" | "playful-light" | "aurora-light" | "github" | "noir-studio" | "studio-dark" | "system";
  };
  /**
   * Custom terminology mappings for white-labeling UI copy
   */
  terminology?: {
    patient?: string;
    patients?: string;
    order?: string;
    orders?: string;
    test?: string;
    tests?: string;
    sample?: string;
    samples?: string;
    laboratory?: string;
    report?: string;
    reports?: string;
    [k: string]: string | undefined;
  };
  /**
   * Feature flags to enable/disable modules
   */
  features?: {
    /**
     * Enable dashboard module
     */
    dashboard?: boolean;
    /**
     * Enable patient management
     */
    patients?: boolean;
    /**
     * Enable order management
     */
    orders?: boolean;
    /**
     * Enable payment processing
     */
    payments?: boolean;
    /**
     * Enable report generation
     */
    reports?: boolean;
    /**
     * Enable test catalog
     */
    catalog?: boolean;
    /**
     * Enable laboratory workflows
     */
    laboratory?: boolean;
    /**
     * Enable sample collection
     */
    labCollection?: boolean;
    /**
     * Enable result entry
     */
    labEntry?: boolean;
    /**
     * Enable result validation
     */
    labValidation?: boolean;
    /**
     * Enable lab monitoring
     */
    labMonitor?: boolean;
    /**
     * Enable audit log
     */
    audit?: boolean;
    /**
     * Enable user management
     */
    users?: boolean;
    [k: string]: boolean | undefined;
  };
  /**
   * Workflow behavior flags
   */
  workflows?: {
    /**
     * Require payment before sample collection
     */
    requirePaymentBeforeCollection?: boolean;
    /**
     * Require doctor approval before collection
     */
    requireDoctorApproval?: boolean;
    /**
     * Require two validators for result validation
     */
    requireDualValidation?: boolean;
    /**
     * Require emergency contact for patients
     */
    requireEmergencyContact?: boolean;
    /**
     * Auto-validate analyzer results that are fully normal
     */
    enableAutoVerification?: boolean;
    [k: string]: boolean | undefined;
  };
  /**
   * Report generation configuration
   */
  reports?: {
    /**
     * Header text for PDF reports
     */
    headerText?: string;
    /**
     * Footer text for PDF reports
     */
    footerText?: string;
    /**
     * Include signature block in reports
     */
    includeSignature?: boolean;
  };
  /**
   * Marketing content for login screen (optional)
   */
  marketing?: {
    /**
     * Feature bullets to display on login screen
     */
    features?: string[];
    /**
     * Marketing description for login screen
     */
    description?: string;
    /**
     * Optional trust line on the login branding panel
     */
    trustIndicator?: {
      text: string;
      count: string;
      audience: string;
    };
  };
}
