/**
 * Lab Feature Types
 *
 * Shared workflow types live in @/types/lab-operations; re-exported here for lab internals.
 */

export type {
  SampleCollectionQueueItem,
  SampleCollectionRequirement,
} from '@/types/lab-operations';

export type SampleRequirement = import('@/types/lab-operations').SampleCollectionRequirement;

import type { TestWithContext } from '@/types';

export type { TestWithContext };

export type TestWithContextResult = TestWithContext & { hasCriticalValues?: boolean };
