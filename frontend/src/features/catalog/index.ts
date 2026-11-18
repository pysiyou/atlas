/**
 * Catalog Feature — public API
 */

export {
  orderableTestAPI,
  useOrderableTests,
  useOrderableTest,
  useOrderableTestsByCodes,
  useOrderableTestSearch,
  useOrderableTestsByCategory,
  useActiveOrderableTests,
  useOrderableTestNameLookup,
  useAnalyteLabelMap,
  useInvalidateOrderableTests,
} from './api/orderableTests';

export {
  workupsAPI,
  useWorkups,
  type Workup,
} from './api/workups';

export {
  affiliationAPI,
  useAffiliationPrice,
  useAffiliationPricing,
  useSelectedAffiliationPrice,
} from './api/affiliations';

export * from './utils/orderableTestLookup';

export {
  getTestClinicalCategory,
  getTestDescription,
  getTestOrderObsLabel,
} from './utils/testDisplay';

export { Catalog as CatalogPage } from './pages/CatalogPage';
export { CatalogList } from './pages/CatalogList';
export { CatalogDetail } from './pages/CatalogDetail';