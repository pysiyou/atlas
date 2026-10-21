import { describe, expect, it } from 'vitest';
import { buildServerListPagination } from './buildServerListPagination';

describe('buildServerListPagination', () => {
  it('returns server mode pagination config', () => {
    const goToPage = () => undefined;
    const config = buildServerListPagination({
      page: 2,
      pagination: { pageSize: 25, total: 100 },
      goToPage,
      pageSizeOptions: [25],
    });
    expect(config).toEqual({
      mode: 'server',
      currentPage: 2,
      pageSize: 25,
      totalItems: 100,
      onPageChange: goToPage,
      onPageSizeChange: undefined,
      pageSizeOptions: [25],
    });
  });
});
