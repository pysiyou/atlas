/**
 * Shared empty-state copy with terminology support.
 * Title: "No …" (sentence case). Subtitle: "{Subject} will appear here when {condition}."
 */

import { t } from './clientConfig';

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
