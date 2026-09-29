import type { TestNameLookup } from '../testDisplay';

export interface EventLogHeadlineContext {
  getTestName: TestNameLookup;
}

export const DEFAULT_HEADLINE_CONTEXT: EventLogHeadlineContext = {
  getTestName: code => code,
};

export interface BuiltEventLogHeadline {
  parts: import('../types').EventLogHeadlinePart[];
  omitActorPrefix?: boolean;
}
