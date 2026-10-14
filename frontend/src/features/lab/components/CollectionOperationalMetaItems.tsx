import type { CollectionOperationalMetaItem } from '../utils/collectionOperationalMetaItems';
import {
  LabCardMetaRow,
  LabModalMetaRow,
  QueueAgeMeta,
  RecollectionRequestedMeta,
} from './LabCardMetaRow';

function CollectionOperationalMetaItemNode({ item }: { item: CollectionOperationalMetaItem }) {
  if (item.type === 'queue-age') {
    return <QueueAgeMeta since={item.since} />;
  }
  if (item.type === 'recollection-requested') {
    return <RecollectionRequestedMeta recollectionSampleId={item.recollectionSampleId} />;
  }
  return <span className={item.className}>{item.text}</span>;
}

/** Renders collection operational facts with card/modal meta-row separators between each item. */
export function CollectionOperationalMetaRow({
  items,
  MetaRow = LabCardMetaRow,
}: {
  items: CollectionOperationalMetaItem[];
  MetaRow?: typeof LabCardMetaRow | typeof LabModalMetaRow;
}) {
  if (items.length === 0) return null;

  return (
    <MetaRow>
      {items.map((item, index) => (
        <CollectionOperationalMetaItemNode key={`${item.type}-${index}`} item={item} />
      ))}
    </MetaRow>
  );
}
