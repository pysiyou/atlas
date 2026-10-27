/**
 * Shared pagination query params for list APIs that use skip/limit.
 */
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';

export interface PageParams {
  page?: number;
  pageSize?: number;
}

/**
 * Converts page + pageSize into skip/limit strings for the query string.
 */
export function buildPaginatedQueryParams(
  page = 1,
  pageSize = DEFAULT_LIST_PAGE_SIZE
): Record<string, string> {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, pageSize);
  return {
    skip: String((safePage - 1) * safeSize),
    limit: String(safeSize),
  };
}

/**
 * Merges pagination params into a flat string record (mutates nothing).
 */
export function withPaginatedParams(
  base: Record<string, string>,
  page?: number,
  pageSize?: number
): Record<string, string> {
  return { ...base, ...buildPaginatedQueryParams(page, pageSize) };
}
