/**
 * Shared empty-state copy.
 * Title: "No …" (sentence case). Subtitle: "{Subject} will appear here when {condition}."
 */

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

export const EMPTY_COPY = {
  recentActivity: {
    title: 'No activity recorded',
    description:
      'Posts will appear here as accession, specimen, result, and oversight events are recorded.',
  },
  activeTests: {
    title: 'No active tests',
    description: emptySubtitle('tests', 'they enter the pipeline'),
  },
  dashboardWorklist: {
    title: emptyTitle("tests in today's view"),
    description: emptySubtitle(
      'tests',
      'pipeline work is open or a row is updated today',
    ),
  },
  dashboardTodaySteps: {
    title: emptyTitle("step times for today's accessions"),
    description: emptySubtitle(
      'step timing metrics',
      "today's accessions include tests in the pipeline",
    ),
  },
  pendingAttention: {
    title: 'No items in queue',
    description:
      'Accessions will appear here when they require pathologist review, operational hold, or expedited handling.',
  },
  recentOrders: {
    title: 'No recent orders',
    description: emptySubtitle('orders', 'new ones are created'),
  },
  relatedOrders: {
    title: 'No related orders',
    description: emptySubtitle('orders', 'this patient has placed one'),
  },
  reports: {
    title: 'No reports',
    description: emptySubtitle('reports', 'results are validated for this patient'),
  },
  orderTests: {
    title: 'No tests',
    description: emptySubtitle('tests', 'they are added to this order'),
  },
  pendingValidation: {
    title: 'No pending validation',
    description: emptySubtitle('results', 'they are ready for validation or review'),
  },
  pendingCollections: {
    title: 'No pending collections',
    description: emptySubtitle('samples', 'they are waiting to be collected'),
  },
  pendingResults: {
    title: 'No pending results',
    description: emptySubtitle('samples', 'they are waiting for result entry'),
  },
  recordedActions: {
    title: 'No recorded actions',
    description: emptySubtitle('actions', 'work is recorded on this record'),
  },
  orderActivity: {
    title: 'No order activity',
    description: emptySubtitle('events', 'the order progresses'),
  },
  data: {
    title: 'No data',
    description: emptySubtitle('items', 'data is available or filters match'),
  },
  matchingPatients: {
    title: 'No matching patients',
    description: emptySubtitle('patients', 'your search matches the directory'),
  },
  matchingTests: {
    title: 'No matching tests',
    description: emptySubtitle('tests', 'your search matches the catalog'),
  },
  matchingSamples: {
    title: 'No matching samples',
    description: emptySubtitle(
      'samples',
      'your search matches a sample ID or patient name',
    ),
  },
} satisfies Record<string, EmptyCopy>;
