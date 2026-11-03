/**
 * Icon registry — single source of truth for semantic icon keys and SVG assets.
 * Components render icons via `<Icon iconKey={IconKeys.actions.close} />`.
 */

import type { ContainerType } from '@/types';

/** Every SVG slug under public/icons/ (filename without .svg). */
export const ICON_ASSETS = [
  'activity',
  'add-circle',
  'alert-circle',
  'here',
  'arrow-bottom',
  'arrow-left',
  'arrow-right',
  'arrow-up',
  'atom-landing-page',
  'beaker-landing-page',
  'bill',
  'bond-molecule-landing-page',
  'book',
  'calendar',
  'cash',
  'category',
  'check',
  'check-circle',
  'city',
  'clock',
  'close',
  'dashboard',
  'database',
  'dislike',
  'dna-landing-page',
  'document',
  'download',
  'drops-droplet-landing-page',
  'edit',
  'eye',
  'finger-print',
  'flask-bold',
  'flask-chemical-landing-page',
  'flask-education-landing-page',
  'health',
  'info',
  'kg',
  'lab-cup',
  'lab-tube',
  'like',
  'link',
  'loading',
  'location',
  'lock',
  'log-out',
  'medical-kit',
  'medicine',
  'medicines-medicine-landing-page',
  'menu',
  'menu-dots',
  'microscope-landing-page',
  'moon',
  'note',
  'notification',
  'pdf',
  'phone',
  'printer',
  'priority',
  'receipt',
  'refresh',
  'ruler',
  'save',
  'search',
  'security',
  'setting',
  'sms',
  'stop',
  'sun',
  'syringe-landing-page',
  'test-tube-landing-page',
  'trash',
  'trending-up',
  'user',
  'verified',
  'vial-landing-page',
  'wallet',
  'warning',
] as const;

export type IconAsset = (typeof ICON_ASSETS)[number];

/** Nested semantic key → SVG asset slug. */
const REGISTRY = {
  domain: {
    priority: 'priority',
    orderStatus: 'info',
    sampleStatus: 'info',
    testStatus: 'info',
    paymentStatus: 'info',
  },
  container: {
    tube: 'lab-tube',
    cup: 'lab-cup',
  },
  dataFields: {
    orderId: 'finger-print',
    patientId: 'finger-print',
    sampleId: 'finger-print',
    testId: 'finger-print',
    user: 'user',
    userHands: 'user',
    gender: 'user',
    birthday: 'calendar',
    phone: 'phone',
    email: 'sms',
    address: 'location',
    mapPin: 'location',
    location: 'location',
    date: 'calendar',
    orderDate: 'calendar',
    time: 'clock',
    referentDoctor: 'user',
    clinicalNotes: 'edit',
    medicalKit: 'medical-kit',
    height: 'ruler',
    weight: 'kg',
    bmi: 'health',
    document: 'document',
    pdf: 'pdf',
    wallet: 'wallet',
    bill: 'bill',
    dollarSign: 'cash',
    cash: 'cash',
    creditCard: 'wallet',
    trendingUp: 'trending-up',
    sampleCollection: 'flask-bold',
  },
  actions: {
    view: 'eye',
    edit: 'edit',
    save: 'save',
    add: 'add-circle',
    delete: 'trash',
    chevronLeft: 'arrow-left',
    chevronRight: 'arrow-right',
    chevronDown: 'arrow-bottom',
    arrowLeft: 'arrow-left',
    arrowUp: 'arrow-up',
    arrowDown: 'arrow-bottom',
    check: 'check',
    checkCircle: 'check-circle',
    like: 'like',
    dislike: 'dislike',
    close: 'close',
    warning: 'warning',
    alertCircle: 'alert-circle',
    infoCircle: 'info',
    loading: 'loading',
    refresh: 'refresh',
    search: 'search',
    filter: 'search',
    download: 'download',
    printer: 'printer',
    menuDots: 'menu-dots',
    menu: 'menu',
    logout: 'log-out',
  },
  ui: {
    category: 'category',
    appLogo: 'here',
    shield: 'security',
    shieldCheck: 'security',
    lock: 'lock',
    verified: 'verified',
    usersGroup: 'user',
    link: 'link',
    city: 'city',
    setting: 'setting',
    bell: 'notification',
    notification: 'notification',
    database: 'database',
  },
  medicalHistory: {
    chronicCondition: 'info',
    medication: 'medicine',
    surgery: 'medicine',
    familyHistory: 'user',
    allergy: 'stop',
    lifestyle: 'health',
  },
  landing: {
    dna: 'dna-landing-page',
    atom: 'atom-landing-page',
    beaker: 'beaker-landing-page',
    bondMolecule: 'bond-molecule-landing-page',
    dropsDroplet: 'drops-droplet-landing-page',
    microscope: 'microscope-landing-page',
    flaskChemical: 'flask-chemical-landing-page',
    flaskEducation: 'flask-education-landing-page',
    medicines: 'medicines-medicine-landing-page',
    syringe: 'syringe-landing-page',
    testTube: 'test-tube-landing-page',
    vial: 'vial-landing-page',
  },
  modules: {
    dashboard: 'dashboard',
    patients: 'user',
    orders: 'receipt',
    laboratory: 'flask-bold',
    labTests: 'note',
    payments: 'wallet',
    reports: 'document',
    catalog: 'book',
    eventLog: 'activity',
    users: 'user',
  },
  feedback: {
    success: 'check-circle',
    info: 'info',
    warning: 'warning',
    danger: 'alert-circle',
    error: 'alert-circle',
  },
  theme: {
    light: 'sun',
    dark: 'moon',
  },
} as const satisfies Record<string, Record<string, IconAsset>>;

type RegistryIconKey<R extends Record<string, Record<string, IconAsset>>> = {
  [C in keyof R]: R[C] extends Record<string, IconAsset>
    ? `${C & string}.${keyof R[C] & string}`
    : never;
}[keyof R];

export type IconKey = RegistryIconKey<typeof REGISTRY>;

function buildAssetByKey(
  registry: typeof REGISTRY
): Record<IconKey, IconAsset> {
  const map = {} as Record<string, IconAsset>;
  for (const [category, entries] of Object.entries(registry)) {
    for (const [leaf, asset] of Object.entries(entries)) {
      map[`${category}.${leaf}`] = asset as IconAsset;
    }
  }
  return map as Record<IconKey, IconAsset>;
}

export const ICON_ASSET_BY_KEY = buildAssetByKey(REGISTRY);

function buildIconKeys(registry: typeof REGISTRY): {
  [C in keyof typeof REGISTRY]: {
    [K in keyof (typeof REGISTRY)[C]]: `${C & string}.${K & string}`;
  };
} {
  const keys = {} as Record<string, Record<string, string>>;
  for (const [category, entries] of Object.entries(registry)) {
    keys[category] = {};
    for (const leaf of Object.keys(entries)) {
      keys[category][leaf] = `${category}.${leaf}`;
    }
  }
  return keys as {
    [C in keyof typeof REGISTRY]: {
      [K in keyof (typeof REGISTRY)[C]]: `${C & string}.${K & string}`;
    };
  };
}

/** Typed semantic keys for `<Icon iconKey={...} />`. */
export const IconKeys = buildIconKeys(REGISTRY);

/** Resolve a semantic key to its SVG asset slug. */
export function resolveIconKey(key: IconKey): IconAsset {
  const asset = ICON_ASSET_BY_KEY[key];
  if (!asset) {
    throw new Error(`Unknown icon key: ${key}`);
  }
  return asset;
}

/** Validate a dot-path key from enum contracts (e.g. payment method iconKey). */
export function parseIconKey(key: string): IconKey {
  resolveIconKey(key as IconKey);
  return key as IconKey;
}

export const getContainerIcon = (type: ContainerType | string): IconKey => {
  const lowerType = type.toLowerCase();
  const isCup =
    lowerType === 'cup' ||
    lowerType.includes('cup') ||
    lowerType.includes('stool');
  return isCup ? IconKeys.container.cup : IconKeys.container.tube;
};

export const getPriorityIcon = (_priority?: string): IconKey =>
  IconKeys.domain.priority;

export const getOrderStatusIcon = (_status?: string): IconKey =>
  IconKeys.domain.orderStatus;

export const getDataFieldIcon = (field: string): IconKey => {
  const fieldKey = field as keyof typeof REGISTRY.dataFields;
  if (fieldKey in REGISTRY.dataFields) {
    return IconKeys.dataFields[fieldKey];
  }
  return IconKeys.dataFields.user;
};

/** Alert / callout variant → icon key */
export const FEEDBACK_ICON_KEYS = {
  info: IconKeys.feedback.info,
  success: IconKeys.feedback.success,
  warning: IconKeys.feedback.warning,
  danger: IconKeys.feedback.danger,
  error: IconKeys.feedback.error,
} as const;

/** Toast variant → icon key (loading uses spinner UI, not an icon). */
export const TOAST_ICON_KEYS: Record<
  'success' | 'error' | 'info' | 'warning' | 'loading',
  IconKey | null
> = {
  success: IconKeys.feedback.success,
  error: IconKeys.feedback.error,
  info: IconKeys.feedback.info,
  warning: IconKeys.feedback.warning,
  loading: null,
};

/** Inline highlight badge color → icon key */
export const INLINE_HIGHLIGHT_ICON_KEYS: Partial<
  Record<'warning' | 'info' | 'danger' | 'success', IconKey>
> = {
  warning: IconKeys.feedback.warning,
  info: IconKeys.feedback.info,
  danger: IconKeys.feedback.danger,
  success: IconKeys.feedback.success,
};
