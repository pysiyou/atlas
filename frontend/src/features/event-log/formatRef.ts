/**
 * Event-log-only display refs (# prefix). Rest of the app uses `displayId` without #.
 */
import { displayId } from '@/utils/id';

/** Event log copy uses lowercase id/code tokens (#ord…, #cbc…); rest of the app keeps displayId casing. */
function eventLogRefBody(label: string): string {
  return label.toLowerCase();
}

export function withHashPrefix(label: string | null | undefined): string {
  if (label === null || label === undefined) return '-';
  const trimmed = String(label).trim();
  if (!trimmed || trimmed === '-') return '-';
  const body = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  return `#${eventLogRefBody(body)}`;
}

function hashDisplayId(format: (id: number | null | undefined) => string) {
  return (id: number | null | undefined): string => {
    const base = format(id);
    return base === '-' ? base : withHashPrefix(base);
  };
}

export const eventLogId = {
  patient: hashDisplayId(displayId.patient),
  order: hashDisplayId(displayId.order),
  sample: hashDisplayId(displayId.sample),
  orderTest: hashDisplayId(displayId.orderTest),
  invoice: hashDisplayId(displayId.invoice),
  payment: hashDisplayId(displayId.payment),
  report: hashDisplayId(displayId.report),
  user: hashDisplayId(displayId.user),
  audit: hashDisplayId(displayId.audit),
};
