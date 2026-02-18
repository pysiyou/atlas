/** Test categories and sample types → badge color */
import type { BadgeColor } from './types';

export const CATALOG_COLOR_MAP: Record<string, BadgeColor> = {
  hematology: 'danger',
  biochemistry: 'info',
  microbiology: 'success',
  serology: 'purple',
  urinalysis: 'warning',
  imaging: 'indigo',
  immunology: 'pink',
  molecular: 'teal',
  toxicology: 'orange',
  coagulation: 'danger',
  chemistry: 'info',
  blood: 'danger',
  urine: 'warning',
  stool: 'warning',
  swab: 'info',
  tissue: 'pink',
  fluid: 'cyan',
  csf: 'indigo',
  sputum: 'success',
  other: 'neutral',
  plasma: 'danger',
  serum: 'warning',
};
