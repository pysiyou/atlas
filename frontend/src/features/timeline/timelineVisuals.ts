import type { TimelineCategory } from './timelineCategories';

export interface TimelineCategoryVisual {
  id: TimelineCategory;
  label: string;
  textClass: string;
}

const CATEGORY_VISUAL: Record<TimelineCategory, TimelineCategoryVisual> = {
  order: {
    id: 'order',
    label: 'Order',
    textClass: 'text-workflow-order-fg',
  },
  payment: {
    id: 'payment',
    label: 'Payment',
    textClass: 'text-workflow-composition-fg',
  },
  sample: {
    id: 'sample',
    label: 'Sample',
    textClass: 'text-workflow-collection-fg',
  },
  result: {
    id: 'result',
    label: 'Result',
    textClass: 'text-workflow-validation-fg',
  },
  other: {
    id: 'other',
    label: 'Supervision',
    textClass: 'text-workflow-escalation-fg',
  },
};

export function getCategoryVisual(category: TimelineCategory): TimelineCategoryVisual {
  return CATEGORY_VISUAL[category];
}
