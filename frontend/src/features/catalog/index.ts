/**
 * Catalog Feature — public API
 */

export {
  testAPI,
  useTestCatalog,
  useTest,
  useTestsByCodes,
  useTestSearch,
  useTestsByCategory,
  useActiveTests,
  useTestNameLookup,
  useParameterLabelMap,
  useInvalidateTestCatalog,
} from './api/tests';

export { panelAPI, useCatalogPanels, type CatalogPanel } from './api/panels';

export {
  affiliationAPI,
  useAffiliationPrice,
  useAffiliationPricing,
  useSelectedAffiliationPrice,
} from './api/affiliations';

export * from './testLookup';

export { Catalog as CatalogPage } from './pages/CatalogPage';
export { CatalogList } from './pages/CatalogList';
export { CatalogDetail } from './pages/CatalogDetail';
