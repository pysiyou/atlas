import type { PriorityLevel } from '@/types';
import {
  attentionTypeSortKey,
  getAttentionType,
} from './attentionCategories';
import type { AttentionItem } from './boardTypes';

const PRIORITY_WEIGHT: Record<PriorityLevel, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function attentionSortScore(item: AttentionItem): number {
  const typeScore = 1000 - attentionTypeSortKey(getAttentionType(item));
  const ageScore = item.waitingHours * 10;
  const priorityScore = PRIORITY_WEIGHT[item.priority] * 100;
  return typeScore + ageScore + priorityScore;
}

function consolidateAttentionItems(candidates: AttentionItem[]): AttentionItem[] {
  const map = new Map<string, AttentionItem>();

  for (const item of candidates) {
    const type = getAttentionType(item);
    const key = `${type}-${item.orderId}-${item.queueTab}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, { ...item, id: key, workItemCount: 1 });
      continue;
    }

    map.set(key, {
      ...existing,
      waitingHours: Math.max(existing.waitingHours, item.waitingHours),
      priority:
        PRIORITY_WEIGHT[item.priority] > PRIORITY_WEIGHT[existing.priority]
          ? item.priority
          : existing.priority,
      since: item.waitingHours > existing.waitingHours ? item.since : existing.since,
      workItemCount: existing.workItemCount + 1,
      orderTestIds: [...new Set([...existing.orderTestIds, ...item.orderTestIds])],
    });
  }

  return Array.from(map.values());
}

export function finalizeAttentionItems(candidates: AttentionItem[]): {
  attentionItems: AttentionItem[];
  attentionTotal: number;
} {
  const attentionTotal = candidates.length;
  const attentionItems = consolidateAttentionItems(candidates).sort(
    (a, b) => attentionSortScore(b) - attentionSortScore(a),
  );
  return { attentionItems, attentionTotal };
}
