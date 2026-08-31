import type { InfoBannerListRow } from '../components/InfoBanner';

/** Map plain strings to list rows (e.g. rejection criteria) */
export function stringsToInfoBannerListRows(items: string[]): InfoBannerListRow[] {
  return items.map(text => ({ primary: text }));
}
