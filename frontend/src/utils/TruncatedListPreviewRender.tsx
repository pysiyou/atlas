import type { ReactNode } from 'react';
import { getTruncatedListPreview } from './array';

/** Renders a truncated list; underlines the "+N more" suffix when truncated. */
export function renderTruncatedListPreview(
  items: (string | number | undefined | null)[] | undefined | null,
): ReactNode {
  const preview = getTruncatedListPreview(items);
  if (preview.kind === 'empty') return null;
  if (preview.kind === 'all') return preview.text;
  return (
    <>
      {preview.first}, +<span className="underline">{preview.remaining} more</span>
    </>
  );
}
