/**
 * Reads the `search` query param used for lab queue deep-links.
 */
import { useSearchParams } from 'react-router-dom';

export function useLabQueueUrlSearch(): string {
  const [searchParams] = useSearchParams();
  return searchParams.get('search') ?? '';
}
