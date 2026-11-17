#!/usr/bin/env python3
"""
Expand Atlas catalog: merge LOINC-verified legacy hospital menu (~99 tests) with
routine panels, specialty analytes, Universal Lab Order value-set panels, and
clinical workup profiles (~150–250 orderable tests).
"""
from __future__ import annotations

import csv
import json
import re
import subprocess
import sys
from collections import defaultdict
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG_DIR = ROOT / "contracts" / "catalog"
LOINC_CORE = ROOT.parent / "Loinc_2.83" / "LoincTableCore" / "LoincTableCore.csv"
LOINC_PANELS = ROOT.parent / "Loinc_2.83" / "AccessoryFiles/PanelsAndForms/PanelsAndForms.csv"
LOINC_ORDERS = (
    ROOT.parent / "Loinc_2.83" / "AccessoryFiles/LoincUniversalLabOrdersValueSet/LoincUniversalLabOrdersValueSet.csv"
)
LEGACY_GIT = "dd8a7eef"

# Import routine definitions from sibling module
import importlib.util

_ROUTINE = ROOT / "scripts" / "build-routine-catalog-from-loinc.py"
_spec = importlib.util.spec_from_file_location("build_routine_catalog_from_loinc", _ROUTINE)
assert _spec and _spec.loader
_routine = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_routine)

ANALYTE_LOINC: dict[str, str] = dict(_routine.ANALYTE_LOINC)
PANEL_TESTS: dict[str, dict] = deepcopy(_routine.PANEL_TESTS)
ROUTINE_WORKUPS: list[dict] = deepcopy(_routine.WORKUPS)
ANALYTE_EXTRA_FIELDS: dict[str, dict] = dict(_routine.ANALYTE_EXTRA_FIELDS)
LEGACY_ANALYTE_ALIAS: dict[str, str] = dict(_routine.LEGACY_ANALYTE_ALIAS)
humanize_loinc_name = _routine.humanize_loinc_name
specimen_for_system = _routine.specimen_for_system
HEMATOLOGY_REJECTION = list(_routine.HEMATOLOGY_REJECTION)
SERUM_REJECTION = list(_routine.SERUM_REJECTION)

ANALYTE_CODE_RENAME = {
    "FE": "IRON",
    "TG": "TRIG",
    "POT": "K",
    "HCO3": "CO2",
    "DDIMER": "DDIM",
    "CTNI": "TROP",
    "AMY": "AMYL",
    "LIP": "LIPA",
    "PT_SEC": "PT",
    "NEUT_PCT": "NEUTP",
    "LYM_PCT": "LYMPHP",
    "MONO_PCT": "MONOP",
    "EOS_PCT": "EOSP",
    "BASO_PCT": "BASOP",
    "NEUT_ABS": "NEUTA",
    "LYM_ABS": "LYMPHA",
    "MONO_ABS": "MONOA",
    "EOS_ABS": "EOSA",
    "BASO_ABS": "BASOA",
}

UA_ANALYTE_LOINC = {
    "UA_COLOR": "5778-6",
    "UA_APPEAR": "5767-9",
    "UA_GRAVITY": "5811-5",
    "UA_PH": "5803-2",
    "UA_PROTEIN": "5804-0",
    "UA_GLUCOSE": "5792-7",
    "UA_KETONES": "2514-8",
    "UA_BILIRUBIN": "5770-3",
    "UA_UROBILIN": "20405-7",
    "UA_NITRITE": "5802-4",
    "UA_LEUK": "5799-2",
    "UA_BLOOD": "5794-3",
    "UA_WBC": "30405-5",
    "UA_RBC": "30391-7",
    "UA_EPITHEL": "5787-7",
    "UA_CASTS": "9842-7",
    "UA_CRYSTALS": "38459-4",
    "UA_BACTERIA": "630-4",
}

EXPANSION_ANALYTE_LOINC = {
    **UA_ANALYTE_LOINC,
    "RETIC": "17849-1",
    "ABO": "883-9",
    "RH": "10331-7",
    "DAT": "1007-4",
    "FIB": "3255-7",
    "ATIII": "27811-9",
    "MG": "19123-9",
    "PO4": "2777-1",
    "LAC": "2524-7",
    "NH3": "16362-6",
    "OSMOL": "2692-2",
    "TRF": "3034-6",
    "LDH": "2532-0",
    "FOOB": "2335-8",
    "FCAL": "38445-3",
    "APOA1": "1869-7",
    "APOB": "1884-6",
    "LPA": "43583-4",
    "INS": "20448-7",
    "CPEP": "1986-9",
    "HSTROP": "89579-7",
    "MYO": "2639-3",
    "HCY": "13965-9",
    "ATPO": "8099-4",
    "ATG": "5385-0",
    "CORT": "2143-6",
    "ACTH": "2141-0",
    "FSH": "15067-2",
    "LH": "10501-5",
    "E2": "2243-4",
    "PROG": "2839-9",
    "PRL": "2842-3",
    "TESTO": "2986-8",
    "BHCG": "21198-7",
    "PTH": "2731-8",
    "HSCRP": "30522-7",
    "RF": "11572-5",
    "ACCP": "32218-0",
    "ANA": "8061-4",
    "C3": "4485-9",
    "C4": "4498-2",
    "IGG": "2465-3",
    "IGA": "2458-8",
    "IGM": "2467-9",
    "IGE": "19113-0",
    "HBSAG": "5196-1",
    "AHBS": "16935-9",
    "AHBC": "16933-6",
    "AHCV": "16128-1",
    "HIVCOMBO": "56888-1",
    "RPR": "24112-5",
    "PSA": "2857-1",
    "PSAF": "10886-0",
    "CEA": "2039-6",
    "CA125": "10334-1",
    "CA199": "24108-3",
    "CA153": "6875-9",
    "AFP": "1834-1",
    "MICROALB": "14957-5",
    "UALB_CR": "9318-7",
    "UPROT24": "2888-6",
    "GGT": "2324-2",
    "CKMB": "13969-1",
    "PROCAL": "33959-8",
    "VITD": "1989-3",
}

RENAL_PANEL = {
    "test_code": "RENAL",
    "loinc_code": "24362-6",
    "name": "Renal Function Panel",
    "analytes": ["GLU", "BUN", "CREA", "EGFR", "CA", "PO4", "ALB", "NA", "K", "CL", "CO2"],
}

EXTRA_SINGLE_TESTS = [
    ("NH3", "16362-6", "NH3"),
    ("OSMOL", "2692-2", "OSMOL"),
    ("INS", "20448-7", "INS"),
    ("CPEP", "1986-9", "CPEP"),
    ("HSTROP", "89579-7", "HSTROP"),
    ("MYO", "2639-3", "MYO"),
    ("HCY", "13965-9", "HCY"),
    ("APOA1", "1869-7", "APOA1"),
    ("APOB", "1884-6", "APOB"),
    ("LPA", "43583-4", "LPA"),
    ("HSCRP", "30522-7", "HSCRP"),
    ("ATPO", "8099-4", "ATPO"),
    ("ATG", "5385-0", "ATG"),
    ("CORT", "2143-6", "CORT"),
    ("ACTH", "2141-0", "ACTH"),
    ("FSH", "15067-2", "FSH"),
    ("LH", "10501-5", "LH"),
    ("E2", "2243-4", "E2"),
    ("PROG", "2839-9", "PROG"),
    ("PRL", "2842-3", "PRL"),
    ("TESTO", "2986-8", "TESTO"),
    ("PTH", "2731-8", "PTH"),
    ("RF", "11572-5", "RF"),
    ("ACCP", "32218-0", "ACCP"),
    ("ANA", "8061-4", "ANA"),
    ("C3", "4485-9", "C3"),
    ("C4", "4498-2", "C4"),
    ("IGG", "2465-3", "IGG"),
    ("IGA", "2458-8", "IGA"),
    ("IGM", "2467-9", "IGM"),
    ("IGE", "19113-0", "IGE"),
    ("PSAF", "10886-0", "PSAF"),
    ("CA125", "10334-1", "CA125"),
    ("CA199", "24108-3", "CA199"),
    ("CA153", "6875-9", "CA153"),
    ("AFP", "1834-1", "AFP"),
    ("FCAL", "38445-3", "FCAL"),
    ("TRF", "3034-6", "TRF"),
    ("UACR", "9318-7", "UALB_CR"),
    ("UPROT24", "2888-6", "UPROT24"),
]

VALUE_SET_ORDER_KEYWORDS = (
    "metabolic panel",
    "lipid panel",
    "hepatic",
    "renal function",
    "thyroid",
    "hepatitis panel",
    "coagulation",
    "iron",
    "urinalysis complete",
    "vitamin b12",
    "vitamin d",
    "apolipoprotein",
    "cardiolipin",
    "protein electrophoresis",
    "glomerular",
    "electrolytes",
    "blood gas",
    "culture",
    "gonorrhea",
    "chlamydia",
    "herpes",
    "varicella",
    "measles",
    "mumps",
    "rubella",
    "lyme",
    "helicobacter",
    "celiac",
    "amylase",
    "lipase",
    "stool",
    "occult",
    "pregnancy",
    "troponin",
    "b-type",
    "natriuretic",
    "drug",
    "toxicology",
    "phenylalanine",
    "lead",
    "mercury",
    "arsenic",
    "chromosome",
    "karyotype",
    "flow cytometry",
    "allergy",
    "immunoglobulin",
)

EXPANDED_WORKUPS = [
    *ROUTINE_WORKUPS,
    {
        "id": "URINE",
        "name": "Urinalysis Workup",
        "description": "Complete urinalysis with microalbumin/creatinine ratio.",
        "test_codes": ["UA", "UACR", "UALB"],
    },
    {
        "id": "HEPATIT",
        "name": "Hepatitis Serology Panel",
        "description": "HBV and HCV serologic screening.",
        "test_codes": ["HBSAG", "AHBS", "AHBC", "AHCV", "LFT"],
    },
    {
        "id": "COAGUL",
        "name": "Coagulation Workup",
        "description": "PT/INR, aPTT, fibrinogen, D-dimer, and antithrombin.",
        "test_codes": ["COAG", "APTT", "FIB", "DDIM", "ATIII"],
    },
    {
        "id": "FERTIL",
        "name": "Fertility Hormone Panel",
        "description": "FSH, LH, estradiol, progesterone, prolactin, and testosterone.",
        "test_codes": ["FSH", "LH", "E2", "PROG", "PRL", "TESTO", "BHCG"],
    },
    {
        "id": "AUTOIMM",
        "name": "Autoimmune Serology Panel",
        "description": "ANA, RF, anti-CCP, complement, and immunoglobulins.",
        "test_codes": ["ANA", "RF", "ACCP", "C3", "C4", "IGG", "IGA", "IGM"],
    },
    {
        "id": "PRENATAL",
        "name": "Prenatal Laboratory Panel",
        "description": "CBC, rubella, HIV, hepatitis B, TSH, and urine protein screening.",
        "test_codes": ["CBC", "RUBELLA", "HIVAGAB", "HBSAG", "TSH", "UA", "BHCG"],
    },
]


def git_json(ref: str, path: str) -> dict:
    raw = subprocess.check_output(["git", "-C", str(ROOT), "show", f"{ref}:{path}"], text=True)
    return json.loads(raw)


def load_loinc_core() -> dict[str, dict[str, str]]:
    out: dict[str, dict[str, str]] = {}
    with LOINC_CORE.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            out[row["LOINC_NUM"]] = row
    return out


def load_panel_children() -> dict[str, list[tuple[int, str]]]:
    children: dict[str, list[tuple[int, str]]] = defaultdict(list)
    with LOINC_PANELS.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            parent = row.get("ParentLoinc")
            if not parent:
                continue
            children[parent].append((int(row["SEQUENCE"]), row["Loinc"]))
    return children


def panel_leaf_observations(parent: str, children: dict[str, list[tuple[int, str]]], core: dict[str, dict]) -> list[str]:
    """Collect quantitative/nominal observation LOINCs under a panel (exclude nested panel CLASS rows)."""
    seen: set[str] = set()
    leaves: list[str] = []

    def walk(node: str) -> None:
        if node in seen:
            return
        seen.add(node)
        rows = children.get(node, [])
        if not rows:
            meta = core.get(node, {})
            cls = meta.get("CLASSTYPE", "")
            if cls == "1" and meta.get("SCALE_TYP") in {"Qn", "Nom", "Ord", "Nar", "SemiQn", "Set", "Doc"}:
                leaves.append(node)
            return
        for _, child in sorted(rows, key=lambda x: x[0]):
            if child == node:
                continue
            walk(child)

    walk(parent)
    out: list[str] = []
    for lc in leaves:
        if lc not in out:
            out.append(lc)
    return out


def rename_analyte_code(code: str) -> str:
    if code == "PLT":
        return "PLAT"
    return ANALYTE_CODE_RENAME.get(code, code)


def suggest_analyte_code(loinc: str, core: dict[str, dict], taken: set[str]) -> str:
    row = core.get(loinc, {})
    comp = re.sub(r"[^A-Za-z0-9]", "", (row.get("COMPONENT") or "OBS")[:16]).upper()
    base = (comp[:8] if len(comp) >= 2 else f"L{loinc.replace('-', '')[:7]}")[:8]
    code = base
    n = 2
    while code in taken:
        code = f"{base[:6]}{n}"[:8]
        n += 1
    taken.add(code)
    return code


def suggest_test_code(name: str, loinc: str) -> str:
    words = re.findall(r"[A-Za-z][A-Za-z0-9]*", name.upper())
    stop = {"PANEL", "SERUM", "PLASMA", "BLOOD", "URINE", "WITH", "AND", "THE", "BY", "OR", "IN", "A", "AN"}
    parts = [w for w in words if w not in stop and len(w) > 1]
    if not parts:
        parts = [f"L{loinc.split('-')[0]}"]
    code = "".join(parts[:2])[:8] if len(parts) >= 2 else parts[0][:8]
    if not code[0].isalpha():
        code = f"T{code}"[:8]
    if len(code) < 2:
        code = f"T{loinc.split('-')[0][-6:]}"[:8]
    return code[:8]


def minimal_numeric_analyte(code: str, loinc: str, core: dict[str, dict]) -> dict:
    row = core.get(loinc, {})
    name = humanize_loinc_name(row.get("LONG_COMMON_NAME", code))
    specimen = specimen_for_system(row.get("SYSTEM", "Ser/Plas"), code)
    scale = row.get("SCALE_TYP", "Qn")
    value_type = "NUMERIC" if scale == "Qn" else "SELECT"
    entry: dict = {
        "analyte_code": code,
        "loinc_code": loinc,
        "name": name,
        "specimen": specimen,
        "value_type": value_type,
        "citations": ["SRC002", "SRC003"],
        "validation_rejection_criteria": HEMATOLOGY_REJECTION if specimen == "Whole Blood" else SERUM_REJECTION,
    }
    if value_type == "NUMERIC":
        entry.setdefault("decimals_suggested", 1)
        entry.setdefault("reference_range", {"adult_general": {"text": "See laboratory reference"}})
    extra = ANALYTE_EXTRA_FIELDS.get(code)
    if extra:
        entry.update(extra)
    return entry


def merge_analytes(legacy: list[dict], core: dict[str, dict]) -> list[dict]:
    by_code: dict[str, dict] = {}
    for raw in legacy:
        code = rename_analyte_code(raw["analyte_code"])
        if code in ANALYTE_CODE_RENAME.values() and raw["analyte_code"] in ANALYTE_CODE_RENAME:
            continue
        entry = deepcopy(raw)
        entry["analyte_code"] = code
        by_code[code] = entry

    all_loinc_map = {**ANALYTE_LOINC, **EXPANSION_ANALYTE_LOINC}
    for code, loinc in all_loinc_map.items():
        alias = LEGACY_ANALYTE_ALIAS.get(code, code)
        if code not in by_code and alias in by_code:
            by_code[code] = deepcopy(by_code[alias])
            by_code[code]["analyte_code"] = code
            by_code[code]["loinc_code"] = loinc
        elif code not in by_code:
            by_code[code] = minimal_numeric_analyte(code, loinc, core)
        else:
            by_code[code]["loinc_code"] = loinc

    # Drop retired codes superseded by rename targets
    drop = set(ANALYTE_CODE_RENAME.keys()) | {"PLT", "UA_CLARITY"}
    for code in list(by_code):
        if code in drop:
            if rename_analyte_code(code) in by_code and rename_analyte_code(code) != code:
                del by_code[code]

    if "UA_APPEAR" not in by_code and "UA_CLARITY" in legacy:
        pass
    if "UA_APPEAR" in by_code and "UA_CLARITY" in by_code:
        del by_code["UA_CLARITY"]

    return sorted(by_code.values(), key=lambda a: a["analyte_code"])


def clone_legacy_test_profile(template: dict | None) -> dict:
    if not template:
        return {
            "category": "General",
            "mapped_category": "general",
            "mapped_sample_type": "serum",
            "sample": {
                "sample_type": "Serum",
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
            "price": 25,
            "confidence": "HIGH",
            "sources": ["SRC002", "SRC003"],
            "validation_rejection_criteria": SERUM_REJECTION,
        }
    skip = {"test_code", "name", "analytes", "loinc_code"}
    return {k: deepcopy(v) for k, v in template.items() if k not in skip}


def make_test_entry(
    test_code: str,
    name: str,
    analytes: list[str],
    loinc_code: str | None,
    template: dict | None,
) -> dict:
    entry = clone_legacy_test_profile(template)
    entry["test_code"] = test_code
    entry["name"] = name
    entry["analytes"] = analytes
    if loinc_code:
        entry["loinc_code"] = loinc_code
    return entry


def merge_tests(
    legacy_tests: list[dict],
    loinc_to_analyte: dict[str, str],
    by_analyte: dict[str, dict],
    children: dict[str, list[tuple[int, str]]],
    core: dict[str, dict],
) -> list[dict]:
    by_code: dict[str, dict] = {}
    templates = {t["test_code"]: t for t in legacy_tests}

    for raw in legacy_tests:
        code = raw["test_code"]
        if code in PANEL_TESTS or code in {p["test_code"] for p in [RENAL_PANEL]}:
            continue
        if code == "PTINR" and "COAG" in PANEL_TESTS:
            continue
        analytes = [rename_analyte_code(a) for a in raw.get("analytes", [])]
        analytes = [a for i, a in enumerate(analytes) if a not in analytes[:i]]
        entry = deepcopy(raw)
        entry["analytes"] = analytes
        by_code[code] = entry

    # Routine / expansion panels
    for code, spec in PANEL_TESTS.items():
        by_code[code] = make_test_entry(
            code,
            spec["name"],
            spec["analytes"],
            spec["loinc_code"],
            templates.get("CBC") or templates.get("GLU"),
        )
    by_code[RENAL_PANEL["test_code"]] = make_test_entry(
        RENAL_PANEL["test_code"],
        RENAL_PANEL["name"],
        RENAL_PANEL["analytes"],
        RENAL_PANEL["loinc_code"],
        templates.get("CREA"),
    )

    # UA complete
    ua_analytes = list(UA_ANALYTE_LOINC.keys())
    by_code["UA"] = make_test_entry(
        "UA",
        "Urinalysis Complete Panel",
        ua_analytes,
        "24356-8",
        templates.get("UA"),
    )

    # Singles added in expansion manifest
    for test_code, loinc, analyte in EXTRA_SINGLE_TESTS:
        if test_code in by_code:
            continue
        tmpl = templates.get(test_code) or templates.get("GLU")
        by_code[test_code] = make_test_entry(
            test_code,
            humanize_loinc_name(core[loinc]["LONG_COMMON_NAME"]),
            [analyte],
            loinc,
            tmpl,
        )

    # Universal lab order panels (curated)
    taken_codes = set(by_analyte)

    def analyte_for_loinc(loinc: str) -> str | None:
        if loinc in loinc_to_analyte:
            return loinc_to_analyte[loinc]
        if loinc not in core:
            return None
        code = suggest_analyte_code(loinc, core, taken_codes)
        entry = minimal_numeric_analyte(code, loinc, core)
        by_analyte[code] = entry
        loinc_to_analyte[loinc] = code
        return code

    used_loinc = {t.get("loinc_code") for t in by_code.values() if t.get("loinc_code")}
    with LOINC_ORDERS.open(newline="", encoding="utf-8") as fh:
        order_rows = list(csv.DictReader(fh))

    for row in order_rows:
        if row["ORDER_OBS"] != "Order":
            continue
        loinc = row["LOINC_NUM"]
        if loinc in used_loinc:
            continue
        name = row["LONG_COMMON_NAME"]
        low = name.lower()
        if not any(k in low for k in VALUE_SET_ORDER_KEYWORDS):
            continue
        leaves = panel_leaf_observations(loinc, children, core)
        if not leaves:
            continue
        analytes: list[str] = []
        for leaf in leaves[:24]:
            ac = analyte_for_loinc(leaf)
            if ac and ac not in analytes:
                analytes.append(ac)
        if len(analytes) < 2:
            continue
        test_code = suggest_test_code(name, loinc)
        base_code = test_code
        n = 2
        while test_code in by_code:
            test_code = f"{base_code[:6]}{n}"[:8]
            n += 1
        by_code[test_code] = make_test_entry(
            test_code, humanize_loinc_name(name), analytes, loinc, templates.get("GLU")
        )
        used_loinc.add(loinc)
        if len(by_code) >= 205:
            break

    for row in order_rows:
        if len(by_code) >= 205:
            break
        if row["ORDER_OBS"] != "Both":
            continue
        loinc = row["LOINC_NUM"]
        if loinc in used_loinc:
            continue
        name = row["LONG_COMMON_NAME"]
        low = name.lower()
        if not any(k in low for k in VALUE_SET_ORDER_KEYWORDS):
            continue
        meta = core.get(loinc)
        if not meta or meta.get("CLASSTYPE") != "1":
            continue
        ac = analyte_for_loinc(loinc)
        if not ac:
            continue
        test_code = suggest_test_code(name, loinc)
        if test_code in by_code or ac == test_code:
            test_code = ac
        if test_code in by_code:
            continue
        by_code[test_code] = make_test_entry(
            test_code, humanize_loinc_name(name), [ac], loinc, templates.get("GLU")
        )
        used_loinc.add(loinc)

    return sorted(by_code.values(), key=lambda t: t["test_code"])


def merge_workups(test_codes: set[str]) -> list[dict]:
    legacy = git_json(LEGACY_GIT, "contracts/catalog/clinical-workups.json")
    by_id: dict[str, dict] = {}
    for w in legacy.get("workups", []):
        wid = w["id"]
        codes = [c for c in w.get("test_codes", []) if c in test_codes]
        if not codes:
            continue
        by_id[wid] = {**w, "test_codes": codes}

    for w in EXPANDED_WORKUPS:
        wid = w["id"]
        codes = [c for c in w.get("test_codes", []) if c in test_codes]
        if not codes:
            continue
        if wid in by_id:
            merged = set(by_id[wid].get("test_codes", [])) | set(codes)
            by_id[wid]["test_codes"] = sorted(merged)
            if w.get("description"):
                by_id[wid]["description"] = w["description"]
        else:
            by_id[wid] = {**w, "test_codes": sorted(codes)}

    return sorted(by_id.values(), key=lambda x: x["id"])


def main() -> None:
    if not LOINC_CORE.is_file():
        print("LOINC 2.83 not found", file=sys.stderr)
        sys.exit(1)

    core = load_loinc_core()
    children = load_panel_children()
    legacy_analytes = git_json(LEGACY_GIT, "contracts/catalog/analyte-catalog.json")["analytes"]
    legacy_tests = git_json(LEGACY_GIT, "contracts/catalog/orderable-tests.json")["tests"]

    merged_analytes = merge_analytes(legacy_analytes, core)
    by_analyte = {a["analyte_code"]: a for a in merged_analytes}
    loinc_to_analyte: dict[str, str] = {}
    for a in merged_analytes:
        lc = a.get("loinc_code")
        if isinstance(lc, str) and lc not in loinc_to_analyte:
            loinc_to_analyte[lc] = a["analyte_code"]

    tests = merge_tests(legacy_tests, loinc_to_analyte, by_analyte, children, core)
    analytes = sorted(by_analyte.values(), key=lambda a: a["analyte_code"])
    test_codes = {t["test_code"] for t in tests}
    workups = merge_workups(test_codes)

    CATALOG_DIR.mkdir(parents=True, exist_ok=True)
    (CATALOG_DIR / "analyte-catalog.json").write_text(
        json.dumps({"$schema": "./analyte-catalog.schema.json", "analytes": analytes}, indent=2, ensure_ascii=False)
        + "\n",
        encoding="utf-8",
    )
    (CATALOG_DIR / "orderable-tests.json").write_text(
        json.dumps({"$schema": "./orderable-tests.schema.json", "tests": tests}, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    (CATALOG_DIR / "clinical-workups.json").write_text(
        json.dumps({"$schema": "./clinical-workups.schema.json", "workups": workups}, indent=2, ensure_ascii=False)
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(analytes)} analytes, {len(tests)} tests, {len(workups)} workups")


if __name__ == "__main__":
    main()