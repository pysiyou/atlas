import type { TestWithContext } from '@/types';

/** True when the order test row has persisted result values on file. */
export function hasTestResults(test: TestWithContext): boolean {
  return Boolean(test.results && Object.keys(test.results).length > 0);
}
