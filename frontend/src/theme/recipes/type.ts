/** Typography scale recipes. */

export const TYPE = {
  pageTitle: 'type-page-title text-text-primary',
  detailTitle: 'type-detail-title text-text-primary',
  /** In-page panel header — xs scale, lighter than pageTitle. */
  panelTitle: 'type-panel-title text-text-primary',
  modalTitle: 'type-modal-title text-text-primary',
  sectionTitle: 'type-section-title text-text-secondary',
  label: 'type-label text-text-secondary',
  value: 'type-body text-text-primary',
  meta: 'type-body text-text-tertiary',
  amount: 'type-amount text-text-primary',
  caption: 'type-caption text-text-tertiary',
} as const;

export const DETAIL_TYPE = {
  value: 'type-detail-value text-text-primary',
  label: 'type-detail-label text-text-secondary',
  meta: 'type-detail-meta text-text-tertiary',
  amount: 'type-detail-value text-text-primary',
  title: 'type-detail-title text-text-primary',
  subtitle: 'type-detail-subtitle text-text-tertiary',
  /** Larger section headings — use when promoting group labels to base scale. */
  sectionTitle: 'type-detail-section-title text-text-secondary',
  /** Default for DetailGroup + DetailsTable row labels until hierarchy pass picks one token. */
  sectionTitleCompact: 'type-section-title text-text-secondary',
  link: 'type-detail-value text-brand underline',
} as const;

export const BUTTON_TYPE = {
  sm: 'type-button-sm',
  md: 'type-button-md',
  lg: 'type-button-lg',
} as const;

export const ICON_SIZE = {
  xs: 'size-icon-xs',
  sm: 'size-icon-sm',
  md: 'size-icon-md',
  lg: 'size-icon-lg',
  button: {
    sm: 'size-icon-button-sm',
    md: 'size-icon-button-md',
    lg: 'size-icon-button-lg',
  },
  labelIcon: {
    sm: 'size-icon-sm',
    md: 'size-icon-md',
    lg: 'size-icon-lg',
  },
} as const;

export const AVATAR_TYPE = {
  circle: {
    xxs: 'type-micro',
    xs: 'type-micro',
    sm: 'type-body',
    md: 'type-amount',
    lg: 'type-body',
    xl: 'type-page-title',
  },
  primary: {
    xxs: 'type-caption',
    xs: 'type-body',
    sm: 'type-amount',
    md: 'type-body',
    lg: 'type-page-title',
    xl: 'type-page-title',
  },
  secondary: {
    xxs: 'type-caption',
    xs: 'type-caption',
    sm: 'type-caption',
    md: 'type-body',
    lg: 'type-amount',
    xl: 'type-body',
  },
} as const;
