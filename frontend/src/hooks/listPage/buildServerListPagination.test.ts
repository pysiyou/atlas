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

  it('handles empty total', () => {
    const config = buildServerListPagination({
      page: 1,
      pagination: { pageSize: 20, total: 0 },
      goToPage: () => undefined,
    });
    expect(config.mode).toBe('server');
    if (config.mode === 'server') {
      expect(config.totalItems).toBe(0);
      expect(config.currentPage).toBe(1);
    }
  });

  it('passes onPageSizeChange when provided', () => {
    const onPageSizeChange = () => undefined;
    const config = buildServerListPagination({
      page: 1,
      pagination: { pageSize: 50, total: 10 },
      goToPage: () => undefined,
      onPageSizeChange,
    });
    if (config.mode === 'server') {
      expect(config.onPageSizeChange).toBe(onPageSizeChange);
    }
  });
});
