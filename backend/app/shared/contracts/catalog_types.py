"""
Catalog wire types — GENERATED from contracts/catalog. DO NOT EDIT.
Regenerate: npm run codegen:catalog
"""
from __future__ import annotations

from typing import Any, Literal, TypedDict


class CatalogDemographicRange(TypedDict, total=False):
    low: float
    high: float
    text: str


class CatalogReferenceRange(TypedDict, total=False):
    adult_general: CatalogDemographicRange
    adult_male: CatalogDemographicRange
    adult_female: CatalogDemographicRange
    pediatric: CatalogDemographicRange


class CatalogNumericRange(TypedDict, total=False):
    low: float
    high: float


class CatalogPhysiologicRange(TypedDict, total=False):
    min: float
    max: float


class CatalogValidationBlock(TypedDict, total=False):
    rejection_criteria: list[str]


CatalogValueType = Literal["NUMERIC", "SELECT", "TEXT"]

# Observed analyte keys: allowed_values, analyte_code, citations, critical_range, decimals_suggested, loinc_code, name, physiologic_range, reference_range, specimen, unit, validation, value_type
class CatalogAnalyteEntry(TypedDict, total=False):
    analyte_code: str
    name: str
    validation: CatalogValidationBlock
    loinc_code: str
    unit: str
    specimen: str
    value_type: CatalogValueType
    allowed_values: list[str]
    reference_range: CatalogReferenceRange
    critical_range: CatalogNumericRange
    physiologic_range: CatalogPhysiologicRange
    decimals_suggested: int
    citations: list[str]
    sample: dict[str, Any]


# Observed test keys: analytes, category, confidence, container_top_colors, container_types, loinc_code, method_common, microbiology, name, notes, order_obs, price, sample, sample_type, sample_volume_description, sources, synonyms, test_category, test_code, turnaround_time_hours, validation
class CatalogOrderableTestEntry(TypedDict, total=False):
    test_code: str
    name: str
    test_category: str
    sample_type: str
    analytes: list[str]
    validation: CatalogValidationBlock
    price: float
    turnaround_time_hours: int
    synonyms: list[str]
    category: str
    method_common: str
    sample: dict[str, Any]
    sample_volume_description: str
    container_types: list[str]
    container_top_colors: list[str]
    loinc_code: str
    sources: list[str]
    confidence: str
    notes: str
    order_obs: str
    microbiology: dict[str, Any]
