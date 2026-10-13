import type { CollectionOperationalMetaItem } from '../utils/collectionOperationalMetaItems';
import { QueueAgeMeta, RecollectionRequestedMeta } from './LabCardMetaRow';

export function CollectionOperationalMetaItems({
  items,
}: {
  items: CollectionOperationalMetaItem[];
}) {
  return (
    <>
      {items.map((item, index) => {
        const key = `${item.type}-${index}`;
        if (item.type === 'queue-age') {
          return <QueueAgeMeta key={key} since={item.since} />;
        }
        if (item.type === 'recollection-requested') {
          return (
            <RecollectionRequestedMeta
              key={key}
              recollectionSampleId={item.recollectionSampleId}
            />
          );
        }
        return (
          <span key={key} className={item.className}>
            {item.text}
          </span>
        );
      })}
    </>
  );
}
