import type { TimelineCategory } from './timelineCategories';

export interface TimelineCategoryVisual {
  id: TimelineCategory;
  label: string;
  textClass: string;
  /** Filled dot on the timeline stem */
  dotClass: string;
}

const CATEGORY_VISUAL: Record<TimelineCategory, TimelineCategoryVisual> = {
  order: {
    id: 'order',
    label: 'Order',
    textClass: 'text-workflow-order-fg',
    dotClass: 'border-workflow-order-border bg-workflow-order-fg',
  },
  payment: {
    id: 'payment',
    label: 'Payment',
    textClass: 'text-workflow-composition-fg',
    dotClass: 'border-workflow-composition-border bg-workflow-composition-fg',
  },
  sample: {
    id: 'sample',
    label: 'Sample',
    textClass: 'text-workflow-collection-fg',
    dotClass: 'border-workflow-collection-border bg-workflow-collection-fg',
  },
  result: {
    id: 'result',
    label: 'Result',
    textClass: 'text-workflow-validation-fg',
    dotClass: 'border-workflow-validation-border bg-workflow-validation-fg',
  },
  other: {
    id: 'other',
    label: 'Supervision',
    textClass: 'text-workflow-escalation-fg',
    dotClass: 'border-workflow-escalation-border bg-workflow-escalation-fg',
  },
};

export function getCategoryVisual(category: TimelineCategory): TimelineCategoryVisual {
  return CATEGORY_VISUAL[category];
}
