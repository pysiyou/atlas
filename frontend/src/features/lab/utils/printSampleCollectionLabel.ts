/**
 * Print a sample collection label, mapping print errors onto catalog toasts.
 */

import type { FeedbackId } from '@/config/feedbackCatalog';
import { notify } from '@/utils/feedback';
import { feedbackTitle } from '@/utils/feedback/copy';
import { printCollectionLabel } from '@/features/lab/collection/SampleCollectionLabelActions';
import type { SampleCollectionQueueItem } from '../types';

const PRINT_LABEL_ERRORS: Record<string, FeedbackId> = {
  [feedbackTitle('lab.collection.printLabel.uncollected')]: 'lab.collection.printLabel.uncollected',
  [feedbackTitle('lab.collection.printLabel.popupBlocked')]: 'lab.collection.printLabel.popupBlocked',
  [feedbackTitle('lab.collection.printLabel.genericError')]: 'lab.collection.printLabel.genericError',
};

export const printSampleCollectionLabel = (
  display: SampleCollectionQueueItem,
  patientName: string
): void => {
  try {
    printCollectionLabel(display, patientName);
  } catch (error) {
    if (error instanceof Error) {
      const catalogId = PRINT_LABEL_ERRORS[error.message];
      if (catalogId) {
        notify.toast(catalogId);
        return;
      }
      notify.toast('lab.collection.printLabel.error', { title: error.message });
    } else {
      notify.toast('lab.collection.printLabel.genericError');
    }
  }
};
