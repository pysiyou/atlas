import { withHashPrefix } from '../formatRef';
import type { EventLogHeadlinePart, EventLogRecord } from '../types';
import type { EventLogHeadlineContext } from '../headline/context';
import { append, mainPart } from '../headline/parts';
import {
  targetOrder,
  targetPatient,
  targetSample,
  targetOrderTestRef,
  testHighlightFromMetaKey,
  userAccountEntityPhrase,
} from '../headline/phrasing';
import type { EventCatalogEntry } from './types';

export function buildFallbackHeadline(
  record: EventLogRecord,
  entry: EventCatalogEntry,
  context: EventLogHeadlineContext
): EventLogHeadlinePart[] {
  const parts: EventLogHeadlinePart[] = [{ text: `${entry.verbPhrase} ` }];
  switch (record.targetType) {
    case 'patient':
      return append(parts, targetPatient(record));
    case 'order':
      return append(parts, targetOrder(record));
    case 'sample':
      return append(parts, targetSample(record));
    case 'order_test':
      return append(parts, ...targetOrderTestRef(record, context));
    case 'user':
      return append(parts, userAccountEntityPhrase(record.targetId));
    case 'test_catalog': {
      const catalogHighlight = testHighlightFromMetaKey(record, 'test_code', context);
      return append(
        parts,
        catalogHighlight ?? mainPart(withHashPrefix(String(record.targetId)))
      );
    }
    default:
      return append(parts, mainPart(withHashPrefix(`${record.targetType}-${record.targetId}`)));
  }
}
