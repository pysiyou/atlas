/**
 * Lab Feature — public API
 */

export { Laboratory } from './pages/LaboratoryPage';
export { CriticalValuesPanel } from './critical-values/CriticalValuesPanel';
export { PopoverForm } from './components/PopoverForm';
export { getLabQueueUrlForTest } from './utils/labQueueLinks';

export {
  sampleAPI,
  useSamplesList,
  useSample,
  useSampleLookup,
  useCollectSample,
  usePaginatedSamples,
} from './api/samples.api';

export {
  resultAPI,
  useEnterResults,
  useValidateResults,
  useResolveEscalation,
  usePendingEscalation,
} from './api/results.api';

export {
  qualityIssuesAPI,
  useQualityIssueOptions,
  useReportQualityIssue,
  useQualityIssuesForOrder,
} from './api/quality-issues.api';

export { auditAPI, useEntityTimeline } from './api/audit.api';

export {
  commandCenterAPI,
  type TimelineEvent,
  type TimelineResponse,
} from './api/commandCenter.api';

export {
  recollectionRequestsAPI,
  usePendingRecollectionRequests,
  useApproveRecollectionRequest,
  useDenyRecollectionRequest,
} from './api/recollection-requests.api';

export {
  criticalValuesAPI,
  type CriticalValueRecord,
} from './critical-values/criticalValues.api';

export {
  usePendingCriticalValues,
  useNotifyCriticalValue,
  useAcknowledgeCriticalValue,
} from './critical-values/useCriticalValues';
