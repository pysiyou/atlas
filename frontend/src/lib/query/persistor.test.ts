import { describe, expect, it } from 'vitest';
import { shouldPersistQuery } from './persistor';
import { queryKeys } from './keys';

describe('shouldPersistQuery', () => {
  it('persists slim catalog list and detail documents', () => {
    expect(shouldPersistQuery(queryKeys.tests.list({ activeOnly: true }))).toBe(true);
    expect(shouldPersistQuery(queryKeys.tests.byCode('CBC'))).toBe(true);
  });

  it('does not persist byCodes batch keys or the legacy all-tests key', () => {
    expect(shouldPersistQuery(queryKeys.tests.byCodes(['CBC', 'CMP']))).toBe(false);
    expect(shouldPersistQuery(queryKeys.tests.all)).toBe(false);
  });

  it('still persists users and affiliations', () => {
    expect(shouldPersistQuery(queryKeys.users.list())).toBe(true);
    expect(shouldPersistQuery(queryKeys.affiliations.pricing())).toBe(true);
  });
});
