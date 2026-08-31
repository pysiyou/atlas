export {
  criticalValuesAPI,
  type CriticalValueRecord,
  type NotifyCriticalValueRequest,
  type AcknowledgeCriticalValueRequest,
} from './api/criticalValues';

export {
  usePendingCriticalValues,
  useNotifyCriticalValue,
  useAcknowledgeCriticalValue,
} from './hooks/useCriticalValues';

export { CriticalValuesPanel } from './components/CriticalValuesPanel';
export { CriticalValueActions } from './components/CriticalValueActions';
export { buildCriticalValueRecord } from './utils/buildCriticalValueRecord';
