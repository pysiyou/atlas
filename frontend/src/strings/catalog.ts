/**
 * Pure UI-string getters from config/ui-strings.json (no React).
 */
import type { IconKey } from '@/icons';
import { IconKeys } from '@/icons';
import {
  getFeedbackTerminologyContext,
  interpolate,
  tCap,
  tLower,
} from '@/config';
import uiStrings from '../../../config/ui-strings.json';

type JsonObject = Record<string, unknown>;

function terminologyContext(extra: Record<string, string> = {}): Record<string, string> {
  return {
    ...getFeedbackTerminologyContext(),
    laboratoryCap: tCap('laboratory', 'Lab'),
    laboratory: tLower('laboratory', 'lab'),
    dashboardCap: tCap('dashboard', 'Dashboard'),
    dashboard: tLower('dashboard', 'dashboard'),
    ...extra,
  };
}

/** Resolve `{{placeholders}}` in a template string. */
export function msg(template: string, extra: Record<string, string> = {}): string {
  return interpolate(template, terminologyContext(extra));
}

function isPlainObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Deep-interpolate string leaves in a JSON-shaped object. */
function msgObject<T extends JsonObject>(obj: T, extra: Record<string, string> = {}): T {
  const ctx = terminologyContext(extra);
  const walk = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return interpolate(value, ctx);
    }
    if (isPlainObject(value)) {
      const out: JsonObject = {};
      for (const [key, nested] of Object.entries(value)) {
        out[key] = walk(nested);
      }
      return out;
    }
    return value;
  };
  return walk(obj) as T;
}

// =============================================================================
// module-titles
// =============================================================================
/** Titles and primary actions for module list pages */
export function getModuleListTitles() {
  const m = uiStrings.modules;
  return {
    patients: msg(m.patients),
    newPatient: msg(m.newPatient),
    patientDetail: msg(m.patientDetail),
    orders: msg(m.orders),
    newOrder: msg(m.newOrder),
    orderDetail: msg(m.orderDetail),
    payments: msg(m.payments),
    reports: msg(m.reports),
    reportsSubtitle: (count: number) => {
      const word = tLower(count === 1 ? 'report' : 'reports', count === 1 ? 'report' : 'reports');
      return `${count} ${word}${m.reportsSubtitleAvailable}`;
    },
    catalog: msg(m.catalog),
    testDetail: msg(m.testDetail),
    editPatient: msg(m.editPatient),
    newPatientModal: msg(m.newPatientModal),
    editOrder: msg(m.editOrder),
    newOrderModal: msg(m.newOrderModal),
    relatedOrders: msg(m.relatedOrders),
    patientInformation: msg(m.patientInformation),
    viewPatient: msg(m.viewPatient),
    addOrder: msg(m.addOrder),
    orderInformation: msg(m.orderInformation),
    orderActivity: msg(m.orderActivity),
    testsPanel: msg(m.testsPanel),
    users: msg(m.users),
    newUser: msg(m.newUser),
    userManagement: msg(m.userManagement),
    labMonitor: msg(m.labMonitor),
  };
}

export type ModuleListTitles = ReturnType<typeof getModuleListTitles>;

export type NavMainKey = keyof typeof uiStrings.nav.main;
export type NavSettingsLinkKey = keyof typeof uiStrings.nav.settingsLinks;

/** Sidebar chrome and main/settings link labels. */
export function getNavCopy() {
  return {
    menu: msg(uiStrings.nav.menu),
    settings: msg(uiStrings.nav.settings),
    mainAriaLabel: msg(uiStrings.nav.mainAriaLabel),
    main: msgObject(uiStrings.nav.main) as Record<NavMainKey, string>,
    settingsLinks: msgObject(uiStrings.nav.settingsLinks) as Record<NavSettingsLinkKey, string>,
  };
}

export type NavCopy = ReturnType<typeof getNavCopy>;

/** Event log panel, search preview, and verbosity copy. */
export function getEventLogCopy() {
  return msgObject(uiStrings.eventLog);
}

export type EventLogCopy = ReturnType<typeof getEventLogCopy>;

// =============================================================================
// table-headers
// =============================================================================
export function getOrderTableColumnHeaders() {
  return msgObject(uiStrings.tables.orders) as {
    orderId: string;
    patientName: string;
    tests: string;
    orderDate: string;
    overallStatus: string;
    priority: string;
    paymentStatus: string;
    totalPrice: string;
  };
}

export type OrderTableColumnHeaders = ReturnType<typeof getOrderTableColumnHeaders>;

export function getPatientTableColumnHeaders() {
  return msgObject(uiStrings.tables.patients) as {
    patientId: string;
    orders: string;
    filterTitle: string;
    searchLabel: string;
    footerLabel: string;
  };
}

export function getUrlFilterChipLabels(): Record<string, string> {
  return msgObject(uiStrings.tables.urlFilterChips);
}

// =============================================================================
// filter-placeholders
// =============================================================================
export function getOrderFilterPlaceholders() {
  return msgObject(uiStrings.filters.orders);
}

export function getPatientFilterPlaceholders() {
  return msgObject(uiStrings.filters.patients);
}

export function getPaymentFilterPlaceholders() {
  return msgObject(uiStrings.filters.payments);
}

export function getReportFilterPlaceholders() {
  return msgObject(uiStrings.filters.reports);
}

export function getSharedFilterPlaceholders() {
  return msgObject(uiStrings.filters.shared);
}

export function getLabQueueFilterPlaceholders() {
  const queues = uiStrings.filters.labQueues;
  const idHint = msg(queues.idHint);
  return {
    collection: msgObject(queues.collection, { idHint }),
    entry: msgObject(queues.entry, { idHint }),
    validation: msgObject(queues.validation, { idHint }),
    allTests: msgObject(queues.allTests, { idHint }),
  };
}

// =============================================================================
// lab copy
// =============================================================================
export function getLabCopy() {
  return msgObject(uiStrings.lab);
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

type EmptyStateLiteral = { title: string; description: string };
type EmptyStateStructured = {
  title?: string;
  titlePhrase?: string;
  description?: string;
  descriptionSubject?: string;
  descriptionWhen?: string;
};

function resolveEmptyState(entry: EmptyStateLiteral | EmptyStateStructured): EmptyCopy {
  if ('title' in entry && typeof entry.title === 'string' && entry.description && !('titlePhrase' in entry)) {
    return {
      title: entry.title.includes('{{') ? msg(entry.title) : entry.title,
      description:
        typeof entry.description === 'string' && entry.description.includes('{{')
          ? msg(entry.description)
          : entry.description,
    };
  }

  const structured = entry as EmptyStateStructured;
  let title: string;
  if (structured.title) {
    title = structured.title.includes('{{') ? msg(structured.title) : structured.title;
  } else if (structured.titlePhrase) {
    title = emptyTitle(msg(structured.titlePhrase));
  } else {
    title = 'No data';
  }

  const description =
    structured.description ??
    emptySubtitle(
      msg(structured.descriptionSubject ?? 'items'),
      structured.descriptionWhen?.includes('{{')
        ? msg(structured.descriptionWhen)
        : (structured.descriptionWhen ?? ''),
    );

  return { title, description };
}

export function getEmptyCopy(): Record<string, EmptyCopy> {
  const out: Record<string, EmptyCopy> = {};
  for (const [key, entry] of Object.entries(uiStrings.emptyStates)) {
    out[key] = resolveEmptyState(entry as EmptyStateLiteral | EmptyStateStructured);
  }
  return out;
}

// =============================================================================
// empty-state-presets
// =============================================================================
export const PANEL_EMPTY_STATE = {
  icon: IconKeys.ui.database satisfies IconKey,
  variant: 'compact' as const,
  fill: true,
} as const;

export const DENSE_EMPTY_STATE = {
  icon: IconKeys.ui.database satisfies IconKey,
  variant: 'dense' as const,
  fill: true,
} as const;

export const DENSE_EMPTY_STATE_TEXT = {
  variant: 'dense' as const,
  fill: true,
} as const;