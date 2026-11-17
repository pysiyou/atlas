import type { FilterValues } from '@/components/filters/types';
import type { TestCategory, OrderableTestSummary } from '@/types';
import { resolveClinicalWorkupLabel } from '@/types/generated/clinicalWorkups';
import { PRICE_RANGE } from '@/utils/constants';

export const catalogListInitialFilters: FilterValues = {
  search: '',
  category: [] as TestCategory[],
  sampleType: [] as string[],
  priceRange: [PRICE_RANGE.MIN, PRICE_RANGE.MAX] as [number, number],
};

/** Client-side catalog list filtering (search, category, sample type, price, name sort). */
export function filterOrderableTests(tests: OrderableTestSummary[], filters: FilterValues): OrderableTestSummary[] {
  const searchQuery = (filters.search as string) ?? '';
  const categoryFilters = (filters.category as TestCategory[]) ?? [];
  const sampleTypeFilters = (filters.sampleType as string[]) ?? [];
  const priceRange =
    (filters.priceRange as [number, number]) ?? [PRICE_RANGE.MIN, PRICE_RANGE.MAX];

  let filtered = tests;

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(test => {
      return (
        test.name.toLowerCase().includes(query) ||
        test.code.toLowerCase().includes(query) ||
        test.synonyms?.some(syn => syn.toLowerCase().includes(query)) ||
        (test.loincCode?.toLowerCase().includes(query) ?? false) ||
        test.workups?.some(
          workupId =>
            workupId.toLowerCase().includes(query) ||
            resolveClinicalWorkupLabel(workupId).toLowerCase().includes(query)
        )
      );
    });
  }

  if (categoryFilters.length > 0) {
    filtered = filtered.filter(test => categoryFilters.includes(test.category));
  }

  if (sampleTypeFilters.length > 0) {
    filtered = filtered.filter(test => sampleTypeFilters.includes(test.sampleType));
  }

  const [minPrice, maxPrice] = priceRange;
  if (minPrice !== PRICE_RANGE.MIN || maxPrice !== PRICE_RANGE.MAX) {
    filtered = filtered.filter(test => test.price >= minPrice && test.price <= maxPrice);
  }

  return filtered.sort((a, b) => a.name.localeCompare(b.name));
}
