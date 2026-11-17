/** Parse and format order_test.flags for display (range + delta). */
import { resolveAnalyteLabel } from '@/features/catalog';

export type AnalyticalFlag =
  | { kind: 'range'; code: string; status: string }
  | { kind: 'delta'; code: string; percentChange: number };

export function parseAnalyticalFlags(flags: string[] | undefined): AnalyticalFlag[] {
  if (!flags?.length) return [];

  return flags.map(flag => {
    if (flag.startsWith('DELTA:')) {
      const [, code = '', pct = ''] = flag.split(':');
      return { kind: 'delta', code, percentChange: parseFloat(pct) };
    }
    const sep = flag.indexOf(':');
    if (sep === -1) return { kind: 'range', code: flag, status: 'flagged' };
    return {
      kind: 'range',
      code: flag.slice(0, sep),
      status: flag.slice(sep + 1),
    };
  });
}

export function analyticalFlagLabel(
  flag: AnalyticalFlag,
  analyteLabels: Record<string, string>
): string {
  return resolveAnalyteLabel(flag.code, analyteLabels);
}

export function analyticalFlagDetail(flag: AnalyticalFlag): string {
  if (flag.kind === 'delta') {
    const pct = Number.isFinite(flag.percentChange) ? flag.percentChange : flag.percentChange;
    return `${pct}% change from prior validated result`;
  }
  return flag.status.replace(/-/g, ' ');
}

export function formatAnalyticalFlag(
  flag: AnalyticalFlag,
  analyteLabels: Record<string, string>
): string {
  return `${analyticalFlagLabel(flag, analyteLabels)}: ${analyticalFlagDetail(flag)}`;
}
