/**
 * Terminology-aware copy: titles, headers, filters, empty states.
 * Style spec: see config/index.ts.
 */
import type { IconKey } from '../icons';
import { IconKeys } from '../icons';
import { t, tCap, tLower, useClientConfig } from './client';


// =============================================================================
// module-titles
// =============================================================================
/** Titles and primary actions for module list pages */
export function getModuleListTitles() {
  const patient = tCap('patient', 'Patient');
  const patients = tCap('patients', 'Patients');
  const order = tCap('order', 'Order');
  const orders = tCap('orders', 'Orders');
  const reports = tCap('reports', 'Reports');
  const test = tCap('test', 'Test');

  return {
    patients,
    newPatient: `New ${patient}`,
    patientDetail: patient,
    orders,
    newOrder: `New ${order}`,
    orderDetail: order,
    payments: 'Payments',
    reports,
    reportsSubtitle: (count: number) =>
      `${count} ${tLower(count === 1 ? 'report' : 'reports', count === 1 ? 'report' : 'reports')}(s) available`,
    catalog: `${test} Catalog`,
    testDetail: test,
    editPatient: `Edit ${patient}`,
    newPatientModal: `New ${patient}`,
    editOrder: `Edit ${order}`,
    newOrderModal: `New ${order}`,
    relatedOrders: `Related ${orders}`,
    patientInformation: `${patient} Information`,
    viewPatient: `View ${patient}`,
    addOrder: `Add ${order}`,
    orderInformation: `${order} Information`,
    orderActivity: `${order} activity`,
    testsPanel: tCap('tests', 'Tests'),
  };
}


// =============================================================================
// table-headers
// =============================================================================
export function getOrderTableColumnHeaders() {
  return {
    orderId: tCap('order', 'Order'),
    patientName: tCap('patient', 'Patient'),
    tests: tCap('tests', 'Tests'),
    orderDate: 'Date',
    overallStatus: 'Status',
    priority: 'Priority',
    paymentStatus: 'Payment',
    totalPrice: 'Total',
  } as const;
}

export type OrderTableColumnHeaders = ReturnType<typeof getOrderTableColumnHeaders>;

export function getPatientTableColumnHeaders() {
  const patient = tCap('patient', 'Patient');
  const patients = tCap('patients', 'Patients');
  return {
    patientId: `${patient} ID`,
    orders: tCap('orders', 'Orders'),
    filterTitle: `${patient} Filters`,
    searchLabel: `Search ${patients}`,
    footerLabel: patients,
  } as const;
}

export function getUrlFilterChipLabels(): Record<string, string> {
  return {
    patientId: tCap('patient', 'Patient'),
    orderId: tCap('order', 'Order'),
    sampleId: tCap('sample', 'Sample'),
    testId: tCap('test', 'Test'),
  };
}


// =============================================================================
// filter-placeholders
// =============================================================================
/** Get placeholders for Orders page filters with terminology */
export function getOrderFilterPlaceholders() {
  return {
    search: `Search ${tLower('orders', 'orders')}...`,
    searchLong: `Search ${tLower('orders', 'orders')} by ID, ${tLower('patient', 'patient')} name, or details...`,
    dateRange: 'Filter by date range',
    orderStatus: `Select ${tLower('order', 'order')} status`,
    paymentStatus: 'Select payment status',
  };
}

/** Get placeholders for Patients page filters with terminology */
export function getPatientFilterPlaceholders() {
  return {
    search: `Search ${tLower('patients', 'patients')}...`,
    searchLong: `Search ${tLower('patients', 'patients')} by name, ID, phone, or email...`,
    ageRange: 'Filter by age range',
    sex: 'Select sex',
    affiliationStatus: 'Select affiliation status',
  };
}

/** Get placeholders for Payments page filters with terminology */
export function getPaymentFilterPlaceholders() {
  return {
    search: 'Search payments...',
    searchLong: `Search payments by transaction ID, ${tLower('patient', 'patient')} name, or reference...`,
    dateRange: 'Filter by date range',
    paymentStatus: 'Select payment status',
    paymentMethod: 'Select payment method',
  };
}

/** Get placeholders for Reports page filters with terminology */
export function getReportFilterPlaceholders() {
  return {
    search: `Search ${tLower('reports', 'reports')}...`,
    searchLong: `Search by ${tLower('test', 'test')} ID, ${tLower('order', 'order')} ID, ${tLower('patient', 'patient')} name, or ${tLower('test', 'test')} name...`,
    dateRange: 'Filter by date range',
  };
}

/** Get shared placeholders for dropdown/range filters with terminology */
export function getSharedFilterPlaceholders() {
  return {
    dateRange: 'Filter by date range',
    ageRange: 'Filter by age range',
    priceRange: 'Filter by price range',
    sampleType: `Select ${tLower('sample', 'sample')} type`,
    status: 'Select status',
    testCategory: `Select ${tLower('test', 'test')} category`,
    paymentMethod: 'Select payment method',
  };
}

/** Lab queue search placeholders with terminology */
export function getLabQueueFilterPlaceholders() {
  const patient = tLower('patient', 'patient');
  const test = tLower('test', 'test');
  const sample = tLower('sample', 'sample');
  const order = tLower('order', 'order');

  const idHint = `${sample} ID (SAM####), ${order} ID (ORD####), ${test} ID (TST####)`;

  return {
    collection: {
      searchPlaceholder: `${tCap('sample', 'Sample')}, ${order}, or ${test} ID (SAM/ORD/TST) — min 3 chars for lookup...`,
      searchHelpText: `Search by ${idHint}, numeric IDs, or ${patient} name. Lookup runs after 3 characters.`,
      dateRangeHelpText: `Filter ${tLower('samples', 'samples')} by collection or ${order} date range.`,
    },
    entry: {
      searchPlaceholder: `${tCap('sample', 'Sample')}, ${order}, or ${test} ID (SAM/ORD/TST) or ${patient}...`,
      searchHelpText: `Search by ${idHint}, ${patient} name, or ${test} name.`,
      dateRangeHelpText: `Filter by ${order} or result date range.`,
    },
    validation: {
      searchPlaceholder: `${tCap('sample', 'Sample')}, ${order}, or ${test} ID (SAM/ORD/TST) or ${patient}...`,
      searchHelpText: `Search by ${idHint}, ${patient} name, or ${test} name.`,
      dateRangeHelpText: `Filter by ${order} or validation date range.`,
    },
    allTests: {
      searchPlaceholder: `${tCap('sample', 'Sample')}, ${order}, or ${test} ID (SAM/ORD/TST), ${patient}, or ${test} name...`,
      searchHelpText: `Search by ${idHint}, ${patient} name, ${test} name, or ${test} code.`,
      dateRangeHelpText: 'Filter by last modified date (UTC).',
    },
  };
}


// =============================================================================
// empty-state-copy
// =============================================================================
export type EmptyCopy = { title: string; description: string };

/** Subtitle: "{Subject} will appear here when {condition}." */
export function emptySubtitle(subject: string, when: string): string {
  const label = subject.trim();
  const cap = label.charAt(0).toUpperCase() + label.slice(1);
  return `${cap} will appear here when ${when}.`;
}

/** Title: "No …" unless the phrase already starts with "No". */
export function emptyTitle(nounPhrase: string): string {
  const phrase = nounPhrase.trim();
  if (/^no\s/i.test(phrase)) return phrase;
  return `No ${phrase}`;
}

/**
 * Get empty state copy with terminology support.
 * Returns functions instead of constants to pick up terminology at runtime.
 */
export function getEmptyCopy(): Record<string, EmptyCopy> {
  return {
    recentActivity: {
      title: 'No activity recorded',
      description:
        'Posts will appear here as accession, specimen, result, and oversight events are recorded.',
    },
    activeTests: {
      title: emptyTitle(t('tests', 'tests')),
      description: emptySubtitle(t('tests', 'tests'), 'they enter the pipeline'),
    },
    allTestsWorklist: {
      title: emptyTitle(`${t('tests', 'tests')} match these filters`),
      description: emptySubtitle(`${t('order', 'order')} ${t('tests', 'tests')}`, 'they are ordered or match your search'),
    },
    dashboardWorklist: {
      title: emptyTitle(`${t('tests', 'tests')} in today's view`),
      description: emptySubtitle(
        t('tests', 'tests'),
        `an ${t('order', 'order')} ${t('test', 'test')} is updated today or still in the pipeline`,
      ),
    },
    dashboardTodayKpi: {
      title: emptyTitle(`${t('laboratory', 'lab')} activity for today`),
      description: emptySubtitle(
        'stage metrics',
        `${t('tests', 'tests')} are in the monitor view (running or updated today)`,
      ),
    },
    pendingAttention: {
      title: 'No items in queue',
      description:
        'Accessions will appear here when they require pathologist review, operational hold, or expedited handling.',
    },
    recentOrders: {
      title: emptyTitle(t('orders', 'recent orders')),
      description: emptySubtitle(t('orders', 'orders'), 'new ones are created'),
    },
    relatedOrders: {
      title: emptyTitle(`related ${t('orders', 'orders')}`),
      description: emptySubtitle(t('orders', 'orders'), `this ${t('patient', 'patient')} has placed one`),
    },
    reports: {
      title: emptyTitle(t('reports', 'reports')),
      description: emptySubtitle(t('reports', 'reports'), `results are validated for this ${t('patient', 'patient')}`),
    },
    orderTests: {
      title: emptyTitle(t('tests', 'tests')),
      description: emptySubtitle(t('tests', 'tests'), `they are added to this ${t('order', 'order')}`),
    },
    pendingValidation: {
      title: 'No pending validation',
      description: emptySubtitle('results', 'they are ready for validation or review'),
    },
    pendingCollections: {
      title: 'No pending collections',
      description: emptySubtitle(t('samples', 'samples'), 'they are waiting to be collected'),
    },
    pendingResults: {
      title: 'No pending results',
      description: emptySubtitle(t('samples', 'samples'), 'they are waiting for result entry'),
    },
    recordedActions: {
      title: 'No recorded actions',
      description: emptySubtitle('actions', 'work is recorded on this record'),
    },
    orderActivity: {
      title: emptyTitle(`${t('order', 'order')} activity`),
      description: emptySubtitle('events', `the ${t('order', 'order')} progresses`),
    },
    data: {
      title: 'No data',
      description: emptySubtitle('items', 'data is available or filters match'),
    },
    matchingPatients: {
      title: emptyTitle(`matching ${t('patients', 'patients')}`),
      description: emptySubtitle(t('patients', 'patients'), 'your search matches the directory'),
    },
    matchingTests: {
      title: emptyTitle(`matching ${t('tests', 'tests')}`),
      description: emptySubtitle(t('tests', 'tests'), 'your search matches the catalog'),
    },
    matchingSamples: {
      title: emptyTitle(`matching ${t('samples', 'samples')}`),
      description: emptySubtitle(
        t('samples', 'samples'),
        `your search matches a ${t('sample', 'sample')} ID or ${t('patient', 'patient')} name`,
      ),
    },
  };
}


// =============================================================================
// empty-state-presets
// =============================================================================
/** Shared empty layout for tables and worklists — icon + title + description. */
export const PANEL_EMPTY_STATE = {
  icon: IconKeys.ui.database satisfies IconKey,
  variant: 'compact' as const,
  fill: true,
} as const;

/** Dense tables / split workspace panels — smaller typography and padding. */
export const DENSE_EMPTY_STATE = {
  icon: IconKeys.ui.database satisfies IconKey,
  variant: 'dense' as const,
  fill: true,
} as const;

export const DENSE_EMPTY_STATE_TEXT = {
  variant: 'dense' as const,
  fill: true,
} as const;


// =============================================================================
// react-hooks
// =============================================================================
/** Module list/detail titles that refresh when client config loads */
export function useModuleListTitles() {
  useClientConfig();
  return getModuleListTitles();
}
