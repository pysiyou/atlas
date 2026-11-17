/**
 * Map contracts/catalog/analyte-catalog.json entries to UI analyte definitions.
 */
import type { AnalyteDefinition, CatalogReferenceRange } from '@/types';
import type { CatalogAnalyteContract, CatalogValueType } from '@/types/catalogContract';

function referenceRangeDisplayText(catalogRefRange?: CatalogReferenceRange): string {
  if (!catalogRefRange) return '';
  const range =
    catalogRefRange.adult_general || catalogRefRange.adult_male || catalogRefRange.adult_female;
  if (!range) return '';
  if (range.text?.trim()) return range.text.trim();
  if (range.low !== undefined && range.high !== undefined) return `${range.low} - ${range.high}`;
  if (range.low !== undefined) return `> ${range.low}`;
  if (range.high !== undefined) return `< ${range.high}`;
  return '';
}

export function analyteDefinitionFromContract(
  contract: CatalogAnalyteContract,
  identity?: { analyteCode?: string; name?: string; loincCode?: string | null; unit?: string | null }
): AnalyteDefinition {
  const valueType = contract.value_type as CatalogValueType | undefined;
  let type: AnalyteDefinition['type'] = 'text';
  if (valueType === 'NUMERIC') type = 'numeric';
  else if (valueType === 'SELECT') type = 'select';
  else if (valueType === 'TEXT') type = 'text';

  const catalogRefRange = contract.reference_range;
  const crit = contract.critical_range;
  const phys = contract.physiologic_range;
  const physRange =
    phys?.min !== undefined && phys?.max !== undefined ? { min: phys.min, max: phys.max } : undefined;

  return {
    code: identity?.analyteCode ?? contract.analyte_code,
    name: identity?.name ?? contract.name,
    unit: identity?.unit ?? contract.unit ?? '',
    type,
    loincCode: identity?.loincCode ?? contract.loinc_code,
    referenceRange: referenceRangeDisplayText(catalogRefRange),
    valueType,
    catalogReferenceRange: catalogRefRange,
    criticalLow: crit?.low,
    criticalHigh: crit?.high,
    allowedValues: contract.allowed_values,
    decimalsSuggested: contract.decimals_suggested,
    decimalPlaces: contract.decimals_suggested,
    physiologicRange: physRange,
  };
}