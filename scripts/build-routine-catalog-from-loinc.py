#!/usr/bin/env python3
"""
Build routine Atlas catalog contracts from LOINC 2.83 (clean slate).

Verifies observation/panel LOINC codes in LoincTableCore.csv, derives display names
from LONG_COMMON_NAME, and writes analyte-catalog.json, orderable-tests.json,
and clinical-workups.json.
"""
from __future__ import annotations

import csv
import json
import copy
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOINC_CORE = ROOT.parent / "Loinc_2.83" / "LoincTableCore" / "LoincTableCore.csv"
CATALOG_DIR = ROOT / "contracts" / "catalog"
LEGACY_ANALYTES = CATALOG_DIR / "analyte-catalog.json"
LEGACY_TESTS = CATALOG_DIR / "orderable-tests.json"

# Observation mnemonic -> LOINC (PLAT used instead of PLT: validate-catalog.mjs deprecates PLT on tests)
ANALYTE_LOINC: dict[str, str] = {
    "WBC": "6690-2",
    "RBC": "789-8",
    "HGB": "718-7",
    "HCT": "4544-3",
    "MCV": "787-2",
    "MCH": "785-6",
    "MCHC": "786-4",
    "RDW": "788-0",
    "PLAT": "777-3",
    "MPV": "32623-1",
    "NEUTP": "770-8",
    "LYMPHP": "736-9",
    "MONOP": "5905-5",
    "EOSP": "713-8",
    "BASOP": "706-2",
    "NEUTA": "751-8",
    "LYMPHA": "731-0",
    "MONOA": "742-7",
    "EOSA": "711-2",
    "BASOA": "704-7",
    "GLU": "2345-7",
    "BUN": "3094-0",
    "CREA": "2160-0",
    "EGFR": "33914-3",
    "NA": "2951-2",
    "K": "2823-3",
    "CL": "2075-0",
    "CO2": "2028-9",
    "CA": "17861-6",
    "URIC": "3084-1",
    "AST": "1920-8",
    "ALT": "1742-6",
    "ALP": "6768-6",
    "GGT": "2324-2",
    "TBIL": "1975-2",
    "DBIL": "1968-7",
    "TP": "2885-2",
    "ALB": "1751-7",
    "AMYL": "1798-8",
    "LIPA": "3040-3",
    "CHOL": "2093-3",
    "HDL": "2085-9",
    "LDL": "13457-7",
    "TRIG": "2571-8",
    "HBA1C": "4548-4",
    "IRON": "2498-4",
    "FERR": "2276-4",
    "TIBC": "2500-7",
    "TSAT": "2502-3",
    "B12": "2132-9",
    "FOL": "2284-8",
    "TSH": "3016-3",
    "FT4": "3024-7",
    "FT3": "3051-0",
    "TROP": "6598-7",
    "BNP": "30934-4",
    "CK": "2157-6",
    "CRP": "1988-5",
    "ESR": "4537-7",
    "VITD": "1989-3",
    "PT": "5902-2",
    "INR": "6301-6",
    "APTT": "14979-9",
    "DDIM": "48065-7",
}

# Legacy analyte_code aliases for clinical metadata reuse
LEGACY_ANALYTE_ALIAS: dict[str, str] = {
    "PLAT": "PLAT",
    "NEUTP": "NEUT_PCT",
    "LYMPHP": "LYM_PCT",
    "MONOP": "MONO_PCT",
    "EOSP": "EOS_PCT",
    "BASOP": "BASO_PCT",
    "NEUTA": "NEUT_ABS",
    "LYMPHA": "LYM_ABS",
    "MONOA": "MONO_ABS",
    "EOSA": "EOS_ABS",
    "BASOA": "BASO_ABS",
    "CO2": "HCO3",
    "TRIG": "TG",
    "AMYL": "AMY",
    "LIPA": "LIP",
    "TROP": "CTNI",
    "DDIM": "DDIMER",
    "URIC": "UA",  # urate vs UA analyte — fall back to loinc row
}

PANEL_TESTS: dict[str, dict] = {
    "CBC": {
        "loinc_code": "57021-8",
        "analytes": [
            "WBC", "RBC", "HGB", "HCT", "MCV", "MCH", "MCHC", "RDW", "PLAT", "MPV",
            "NEUTP", "LYMPHP", "MONOP", "EOSP", "BASOP",
            "NEUTA", "LYMPHA", "MONOA", "EOSA", "BASOA",
        ],
        "name": "Complete Blood Count (CBC) with Automated Differential",
    },
    "BMP": {
        "loinc_code": "51990-0",
        "analytes": ["GLU", "BUN", "CREA", "EGFR", "NA", "K", "CL", "CO2", "CA"],
        "name": "Basic Metabolic Panel (BMP)",
    },
    "CMP": {
        "loinc_code": "24323-8",
        "analytes": [
            "GLU", "BUN", "CREA", "EGFR", "NA", "K", "CL", "CO2", "CA",
            "TP", "ALB", "TBIL", "ALP", "AST", "ALT",
        ],
        "name": "Comprehensive Metabolic Panel (CMP)",
    },
    "LFT": {
        "loinc_code": "24325-3",
        "analytes": ["AST", "ALT", "ALP", "GGT", "TBIL", "DBIL", "TP", "ALB"],
        "name": "Hepatic Function Panel (LFT)",
    },
    "LIPID": {
        "loinc_code": "57698-3",
        "analytes": ["CHOL", "HDL", "LDL", "TRIG"],
        "name": "Lipid Panel with Direct LDL",
    },
    "IRONP": {
        # LOINC 24362-6 is Renal function 2000 panel in 2.83; 50190-8 is Universal Lab Orders iron panel.
        "loinc_code": "50190-8",
        "analytes": ["IRON", "TIBC", "TSAT"],
        "name": "Iron and Iron Binding Capacity Panel",
    },
    "COAG": {
        "loinc_code": "34714-6",
        "analytes": ["PT", "INR", "APTT"],
        "name": "Coagulation Panel (PT/INR/aPTT)",
    },
}

SINGLE_TESTS: dict[str, dict] = {
    "TSH": {"loinc_code": "3016-3", "analytes": ["TSH"]},
    "FT4": {"loinc_code": "3024-7", "analytes": ["FT4"]},
    "FT3": {"loinc_code": "3051-0", "analytes": ["FT3"]},
    "HBA1C": {"loinc_code": "4548-4", "analytes": ["HBA1C"]},
    "FERR": {"loinc_code": "2276-4", "analytes": ["FERR"]},
    "B12": {"loinc_code": "2132-9", "analytes": ["B12"]},
    "FOL": {"loinc_code": "2284-8", "analytes": ["FOL"]},
    "TROP": {"loinc_code": "6598-7", "analytes": ["TROP"]},
    "BNP": {"loinc_code": "30934-4", "analytes": ["BNP"]},
    "CK": {"loinc_code": "2157-6", "analytes": ["CK"]},
    "CRP": {"loinc_code": "1988-5", "analytes": ["CRP"]},
    "ESR": {"loinc_code": "4537-7", "analytes": ["ESR"]},
    "VITD": {"loinc_code": "1989-3", "analytes": ["VITD"]},
    "DDIM": {"loinc_code": "48065-7", "analytes": ["DDIM"]},
    "URIC": {"loinc_code": "3084-1", "analytes": ["URIC"]},
    "AMYL": {"loinc_code": "1798-8", "analytes": ["AMYL"]},
    "LIPA": {"loinc_code": "3040-3", "analytes": ["LIPA"]},
    "GLU": {"loinc_code": "2345-7", "analytes": ["GLU"]},
    "CREA": {"loinc_code": "2160-0", "analytes": ["CREA"]},
}

WORKUPS = [
    {
        "id": "ANEMIA",
        "name": "Anemia Workup",
        "description": "Routine anemia evaluation: CBC, iron studies, ferritin, B12, and folate.",
        "test_codes": ["CBC", "IRONP", "FERR", "B12", "FOL"],
    },
    {
        "id": "TFT",
        "name": "Thyroid Function Panel",
        "description": "TSH with free T4 and free T3.",
        "test_codes": ["TSH", "FT4", "FT3"],
    },
    {
        "id": "ACS",
        "name": "Acute Coronary Syndrome Panel",
        "description": "Cardiac biomarkers and supporting labs for ACS evaluation.",
        "test_codes": ["TROP", "CK", "BNP", "CBC", "BMP", "COAG", "DDIM"],
    },
    {
        "id": "METAB",
        "name": "Metabolic Health Panel",
        "description": "Metabolic screening: CMP, lipids, HbA1c, uric acid, and TSH.",
        "test_codes": ["CMP", "LIPID", "HBA1C", "URIC", "TSH"],
    },
    {
        "id": "INFLAM",
        "name": "Inflammatory Markers Panel",
        "description": "CBC with CRP and ESR.",
        "test_codes": ["CBC", "CRP", "ESR"],
    },
    {
        "id": "GENCHK",
        "name": "General Health Check",
        "description": "Broad preventive screening profile.",
        "test_codes": ["CBC", "CMP", "LIPID", "TSH", "VITD"],
    },
]

HEMATOLOGY_REJECTION = [
    "clotted",
    "contaminated",
    "hemolyzed_severe",
    "icteric",
    "qns",
    "lipemic",
    "analyzer_flag_repeat_run_on_same_sample",
    "instrument_error_repeat_run",
    "platelet_clumps_aggregation_flags_repeat_count",
    "procedural_error_during_analysis",
    "qc_control_failure",
]

SERUM_REJECTION = [
    "contaminated",
    "hemolyzed_severe",
    "icteric",
    "qns",
    "lipemic",
    "critical_value_repeat_for_verification",
    "delta_check_failure_repeat_run",
    "fasting_requirements_not_met",
    "instrument_error_repeat_run",
    "procedural_error_during_analysis",
    "qc_control_failure",
]

ANALYTE_EXTRA_FIELDS: dict[str, dict] = {
    "EGFR": {
        "value_type": "NUMERIC",
        "unit": "mL/min/1.73 m²",
        "decimals_suggested": 0,
        "name": "Estimated GFR (MDRD)",
        "reference_range": {"adult_general": {"low": 60, "high": 120, "text": "≥60 mL/min/1.73 m²"}},
        "physiologic_range": {"min": 5, "max": 200},
        "critical_range": {"low": 15},
        "citations": ["SRC002", "SRC003"],
    },
    "TROP": {
        "value_type": "NUMERIC",
        "unit": "ng/mL",
        "decimals_suggested": 3,
        "name": "Troponin T",
        "reference_range": {"adult_general": {"high": 0.01, "text": "<0.01 ng/mL"}},
        "physiologic_range": {"min": 0, "max": 100},
        "critical_range": {"low": 0.1},
        "citations": ["SRC002", "SRC003"],
    },
    "URIC": {
        "value_type": "NUMERIC",
        "unit": "mg/dL",
        "decimals_suggested": 1,
        "name": "Uric Acid",
        "reference_range": {"adult_general": {"low": 3.5, "high": 7.2}},
        "physiologic_range": {"min": 0, "max": 30},
        "critical_range": {"high": 12},
        "citations": ["SRC002", "SRC003"],
    },
    "VITD": {
        "value_type": "NUMERIC",
        "unit": "ng/mL",
        "decimals_suggested": 1,
        "name": "25-Hydroxyvitamin D",
        "reference_range": {"adult_general": {"low": 30, "high": 100}},
        "physiologic_range": {"min": 0, "max": 200},
        "critical_range": {"low": 10},
        "citations": ["SRC002", "SRC003"],
    },
}

COAG_REJECTION = [
    "clotted",
    "hemolyzed_severe",
    "qns",
    "lipemic",
    "wrong_container",
    "aberrant_clotting_curve_repeat_run",
    "instrument_error_repeat_run",
    "procedural_error_during_analysis",
    "qc_control_failure",
]


def load_loinc_core() -> dict[str, dict[str, str]]:
    """Index ACTIVE laboratory rows by LOINC_NUM."""
    if not LOINC_CORE.is_file():
        print(f"Missing LOINC core table: {LOINC_CORE}", file=sys.stderr)
        sys.exit(1)
    out: dict[str, dict[str, str]] = {}
    with LOINC_CORE.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            code = row["LOINC_NUM"]
            out[code] = {
                "long_name": row["LONG_COMMON_NAME"],
                "shortname": row.get("SHORTNAME") or "",
                "system": row["SYSTEM"],
                "scale_typ": row["SCALE_TYP"],
                "status": row["STATUS"],
                "classtype": row["CLASSTYPE"],
            }
    return out


def humanize_loinc_name(long_name: str) -> str:
    """Short clinical display name from LOINC LONG_COMMON_NAME."""
    text = long_name.strip()
    for suffix in (
        " in Serum or Plasma",
        " in Serum or Plasma by Automated count",
        " in Blood by Automated count",
        " in Blood",
        " in Platelet poor plasma",
        " in Platelet poor plasma by Coagulation assay",
        " in Red Blood Cells by Automated count",
        " in PPP by Coagulation assay",
    ):
        if text.endswith(suffix):
            text = text[: -len(suffix)]
    text = re.sub(r"\s+\[.*?\]", "", text)
    text = re.sub(r"\s{2,}", " ", text).strip()
    return text or long_name


def specimen_for_system(system: str, mnemonic: str) -> str:
    """Map LOINC SYSTEM to Atlas specimen label."""
    sys_upper = system.upper()
    if sys_upper in {"BLD", "RBC"}:
        return "Whole Blood"
    if "PPP" in sys_upper:
        return "Plasma (citrated)"
    if mnemonic in {"PT", "INR", "APTT", "DDIM"}:
        return "Plasma (citrated)"
    if mnemonic == "HBA1C":
        return "Whole Blood"
    return "Serum"


def load_legacy_by_code() -> dict[str, dict]:
    legacy = json.loads(LEGACY_ANALYTES.read_text(encoding="utf-8"))
    return {a["analyte_code"]: a for a in legacy.get("analytes", []) if a.get("analyte_code")}


def load_legacy_by_loinc() -> dict[str, dict]:
    legacy = json.loads(LEGACY_ANALYTES.read_text(encoding="utf-8"))
    return {a["loinc_code"]: a for a in legacy.get("analytes", []) if a.get("loinc_code")}


def load_legacy_tests_by_code() -> dict[str, dict]:
    legacy = json.loads(LEGACY_TESTS.read_text(encoding="utf-8"))
    return {t["test_code"]: t for t in legacy.get("tests", []) if t.get("test_code")}


def build_analyte_entry(
    mnemonic: str,
    loinc: str,
    loinc_rows: dict[str, dict[str, str]],
    legacy_by_code: dict[str, dict],
    legacy_by_loinc: dict[str, dict],
) -> dict:
    if loinc not in loinc_rows:
        raise ValueError(f"LOINC {loinc} not found for analyte {mnemonic}")
    row = loinc_rows[loinc]
    alias = LEGACY_ANALYTE_ALIAS.get(mnemonic, mnemonic)
    template = legacy_by_code.get(alias) or legacy_by_loinc.get(loinc)
    entry: dict = {}
    if template:
        entry = {k: v for k, v in template.items() if k not in {"analyte_code", "name", "loinc_code", "specimen"}}
    entry["analyte_code"] = mnemonic
    entry["loinc_code"] = loinc
    entry["name"] = humanize_loinc_name(row["long_name"])
    entry["specimen"] = specimen_for_system(row["system"], mnemonic)
    if not isinstance(entry.get("validation"), dict):
        if entry.get("specimen") == "Whole Blood":
            entry["validation"] = {"rejection_criteria": HEMATOLOGY_REJECTION}
        elif mnemonic in {"PT", "INR", "APTT", "DDIM"}:
            entry["validation"] = {"rejection_criteria": COAG_REJECTION}
        else:
            entry["validation"] = {"rejection_criteria": SERUM_REJECTION}
    # TSAT from legacy may be missing
    if mnemonic == "TSAT" and "value_type" not in entry:
        entry.update(
            {
                "value_type": "NUMERIC",
                "unit": "%",
                "decimals_suggested": 0,
                "reference_range": {"adult_general": {"low": 20, "high": 50}},
                "physiologic_range": {"min": 0, "max": 100},
            }
        )
    if mnemonic == "URIC" and entry.get("analyte_code") == "UA":
        entry["analyte_code"] = mnemonic
    if mnemonic == "PLAT":
        entry["name"] = "Platelet Count"
    extra = ANALYTE_EXTRA_FIELDS.get(mnemonic)
    if extra:
        for key, val in extra.items():
            entry[key] = val
    return entry


def specimen_sample_profile(test_code: str, analyte_codes: list[str]) -> dict:
    if test_code == "CBC":
        return {
            "category": "Hematology",
            "test_category": "hematology",
            "sample_type": "blood",
            "sample": {
                "sample_type": "blood",
                "container": "EDTA tube (lavender cap), 3 mL",
                "minimum_volume_ml": 2,
                "fasting_required": False,
                "collection_notes": "Mix gently by inversion 8-10 times; analyze within 24 hours.",
                "rejection_criteria": [
                    "clotted",
                    "hemolyzed_severe",
                    "wrong_container",
                    "qns",
                    "labeling_error_mismatch",
                    "labeling_error_unlabeled",
                ],
            },
            "container_types": ["tube"],
            "container_top_colors": ["lavender-top"],
            "sample_volume_description": "3 mL",
            "method_common": "Automated hematology analyzer",
            "turnaround_time_hours": 2,
            "price": 25,
            "validation": {"rejection_criteria": HEMATOLOGY_REJECTION},
        }
    if test_code == "COAG":
        return {
            "category": "Coagulation",
            "test_category": "coagulation",
            "sample_type": "blood",
            "sample": {
                "sample_type": "blood",
                "container": "Citrate tube (light-blue cap), 2.7 mL",
                "minimum_volume_ml": 2,
                "fasting_required": False,
                "collection_notes": "Fill to line; invert 3-4 times; centrifuge within 4 hours.",
                "rejection_criteria": ["clotted", "wrong_container", "qns", "hemolyzed_severe"],
            },
            "container_types": ["tube"],
            "container_top_colors": ["light-blue-top"],
            "sample_volume_description": "2.7 mL",
            "method_common": "Optical clot detection",
            "turnaround_time_hours": 2,
            "price": 35,
            "validation": {"rejection_criteria": COAG_REJECTION},
        }
    if test_code in {"LIPID", "BMP", "CMP", "LFT", "IRONP"} or test_code in SINGLE_TESTS:
        fasting = test_code in {"LIPID", "GLU", "IRONP", "AMYL", "LIPA"}
        return {
            "category": "Clinical Chemistry",
            "test_category": "biochemistry",
            "sample_type": "serum",
            "sample": {
                "sample_type": "serum",
                "container": "Serum separator tube (gold or red cap), 3-5 mL",
                "minimum_volume_ml": 2,
                "fasting_required": fasting,
                "collection_notes": "Centrifuge and aliquot if not analyzed within 2 hours." if not fasting else "12-hour fasting preferred.",
                "rejection_criteria": [
                    "hemolyzed_severe",
                    "icteric",
                    "lipemic",
                    "wrong_container",
                    "qns",
                    "labeling_error_mismatch",
                    "labeling_error_unlabeled",
                ],
            },
            "container_types": ["tube"],
            "container_top_colors": ["gold-top"],
            "sample_volume_description": "3 mL",
            "method_common": "Clinical chemistry analyzer",
            "turnaround_time_hours": 4,
            "price": 30,
            "validation": {"rejection_criteria": SERUM_REJECTION},
        }
    return {
        "category": "General",
        "test_category": "biochemistry",
        "sample_type": "serum",
        "sample": {
            "sample_type": "serum",
            "container": "Serum separator tube, 3 mL",
            "minimum_volume_ml": 2,
            "fasting_required": False,
            "collection_notes": "",
            "rejection_criteria": ["qns", "wrong_container"],
        },
        "container_types": ["tube"],
        "container_top_colors": ["gold-top"],
        "sample_volume_description": "3 mL",
        "method_common": "Clinical laboratory analyzer",
        "turnaround_time_hours": 4,
        "price": 20,
        "validation": {"rejection_criteria": SERUM_REJECTION},
    }


def build_test_entry(
    test_code: str,
    spec: dict,
    loinc_rows: dict[str, dict[str, str]],
    legacy_tests: dict[str, dict],
) -> dict:
    name = spec.get("name")
    if not name and spec.get("loinc_code"):
        loinc_name = loinc_rows.get(spec["loinc_code"], {}).get("long_name")
        name = humanize_loinc_name(loinc_name) if loinc_name else test_code
    legacy = legacy_tests.get(test_code)
    entry: dict = {
        "test_code": test_code,
        "name": name or test_code,
        "analytes": spec["analytes"],
    }
    if spec.get("loinc_code"):
        entry["loinc_code"] = spec["loinc_code"]
    profile = specimen_sample_profile(test_code, spec["analytes"])
    entry.update(profile)
    if legacy:
        for key in ("synonyms", "sources", "confidence", "notes", "order_obs"):
            if key in legacy:
                entry[key] = copy.deepcopy(legacy[key])
    entry.setdefault("confidence", "HIGH")
    entry.setdefault("sources", ["SRC002", "SRC003"])
    if len(spec["analytes"]) == 1:
        analyte = spec["analytes"][0]
        if not legacy:
            entry["name"] = entry["name"] if entry["name"] != test_code else analyte
    return entry


def main() -> None:
    loinc_rows = load_loinc_core()
    legacy_by_code = load_legacy_by_code()
    legacy_by_loinc = load_legacy_by_loinc()
    legacy_tests = load_legacy_tests_by_code()

    needed_loinc = set(ANALYTE_LOINC.values())
    for spec in {**PANEL_TESTS, **SINGLE_TESTS}.values():
        if spec.get("loinc_code"):
            needed_loinc.add(spec["loinc_code"])

    missing = [c for c in sorted(needed_loinc) if c not in loinc_rows]
    if missing:
        print("Missing LOINC codes in LoincTableCore:", ", ".join(missing), file=sys.stderr)
        sys.exit(1)

    analytes = [
        build_analyte_entry(m, lc, loinc_rows, legacy_by_code, legacy_by_loinc)
        for m, lc in sorted(ANALYTE_LOINC.items(), key=lambda x: x[0])
    ]

    tests = []
    for code, spec in PANEL_TESTS.items():
        tests.append(build_test_entry(code, spec, loinc_rows, legacy_tests))
    for code, spec in sorted(SINGLE_TESTS.items()):
        tests.append(build_test_entry(code, spec, loinc_rows, legacy_tests))
    tests.sort(key=lambda t: t["test_code"])

    analyte_doc = {
        "$schema": "./analyte-catalog.schema.json",
        "analytes": analytes,
    }
    tests_doc = {
        "$schema": "./orderable-tests.schema.json",
        "tests": tests,
    }
    workups_doc = {
        "$schema": "./clinical-workups.schema.json",
        "workups": WORKUPS,
    }

    CATALOG_DIR.mkdir(parents=True, exist_ok=True)
    for fname, doc in (
        ("analyte-catalog.json", analyte_doc),
        ("orderable-tests.json", tests_doc),
        ("clinical-workups.json", workups_doc),
    ):
        path = CATALOG_DIR / fname
        path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Wrote {path} ({len(doc.get('analytes') or doc.get('tests') or doc.get('workups'))} entries)")


if __name__ == "__main__":
    main()