import { describe, expect, it } from 'vitest';
import { matchLabQueueSearchQuery, labQueueSearchTextFields } from './labSearchAndLinks';

describe('matchLabQueueSearchQuery', () => {
  const ids = { orderTestId: 7, orderId: 42, sampleId: 99 };
  const textFields = labQueueSearchTextFields(ids, ['Jane Doe', 'CBC']);

  it('matches TST display id', () => {
    expect(matchLabQueueSearchQuery(ids, textFields, 'TST0007')).toBe(true);
  });

  it('matches ORD display id', () => {
    expect(matchLabQueueSearchQuery(ids, textFields, 'ORD0042')).toBe(true);
  });

  it('matches SAM display id', () => {
    expect(matchLabQueueSearchQuery(ids, textFields, 'SAM0099')).toBe(true);
  });

  it('matches numeric id against any entity id', () => {
    expect(matchLabQueueSearchQuery(ids, textFields, '42')).toBe(true);
  });

  it('matches patient name substring', () => {
    expect(matchLabQueueSearchQuery(ids, textFields, 'jane')).toBe(true);
  });
});
