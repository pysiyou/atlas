#!/usr/bin/env python3
"""Extract specimen & result rejection registries from local LOINC 2.83 and Atlas seed reasons."""
from __future__ import annotations

import csv
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOINC_ROOT = ROOT.parent / "Loinc_2.83"
LOINC_CORE = LOINC_ROOT / "LoincTableCore" / "LoincTableCore.csv"
ANSWER_LIST = LOINC_ROOT / "AccessoryFiles" / "AnswerFile" / "AnswerList.csv"
ANSWER_LINK = LOINC_ROOT / "AccessoryFiles" / "AnswerFile" / "LoincAnswerListLink.csv"
IT_VARIANT = LOINC_ROOT / "AccessoryFiles" / "LinguisticVariants" / "itIT16LinguisticVariant.csv"
REG_DIR = ROOT / "contracts" / "registries"

# Baseline reasons merged into registries when LOINC lists do not define them.
ATLAS_SEED_REASONS: list[dict] = [
    {"id": "aberrant_clotting_curve_repeat_run", "label": "Aberrant clotting curve — repeat run", "domain": "analytical"},
    {"id": "ambiguous_identification_repeat_workup", "label": "Ambiguous identification — repeat workup", "domain": "analytical"},
    {"id": "analyzer_flag_repeat_run_on_same_sample", "label": "Analyzer flag — repeat run on same sample", "domain": "analytical"},
    {"id": "critical_value_repeat_for_verification", "label": "Critical value — repeat for verification", "domain": "analytical"},
    {"id": "delta_check_failure_repeat_run", "label": "Delta check failure — repeat run", "domain": "analytical"},
    {"id": "equivocal_result_repeat_run", "label": "Equivocal result — repeat run", "domain": "analytical"},
    {"id": "fasting_requirements_not_met", "label": "Fasting requirements not met", "domain": "analytical"},
    {"id": "indeterminate_result_repeat_run", "label": "Indeterminate result — repeat run", "domain": "analytical"},
    {"id": "instrument_error_repeat_run", "label": "Instrument error — repeat run", "domain": "analytical"},
    {"id": "insufficient_growth_repeat_incubation", "label": "Insufficient growth — repeat incubation", "domain": "analytical"},
    {"id": "invalid_coagulation_control_repeat_run", "label": "Invalid coagulation control — repeat run", "domain": "analytical"},
    {"id": "invalid_device_expired_cartridge", "label": "Invalid device / expired cartridge", "domain": "analytical"},
    {"id": "invalid_or_expired_reagent_repeat_run", "label": "Invalid or expired reagent — repeat run", "domain": "analytical"},
    {"id": "leaked_or_broken_container", "label": "Leaked or broken container", "domain": "analytical"},
    {"id": "not_protected_from_light", "label": "Not protected from light", "domain": "analytical"},
    {"id": "overfilled_tube", "label": "Overfilled tube", "domain": "analytical"},
    {"id": "platelet_clumps_aggregation_flags_repeat_count", "label": "Platelet clumps / aggregation flags — repeat count", "domain": "analytical"},
    {"id": "procedural_error_during_analysis", "label": "Procedural error during analysis", "domain": "analytical"},
    {"id": "qc_control_failure", "label": "QC / control failure", "domain": "analytical"},
    {"id": "clotted", "label": "Clotted sample", "domain": "specimen"},
    {"id": "contaminated", "label": "Contaminated sample", "domain": "specimen"},
    {"id": "hemolyzed_mild", "label": "Hemolyzed - Mild", "domain": "specimen"},
    {"id": "hemolyzed_moderate", "label": "Hemolyzed - Moderate", "domain": "specimen"},
    {"id": "hemolyzed_severe", "label": "Hemolyzed - Severe", "domain": "specimen"},
    {"id": "icteric", "label": "Icteric sample", "domain": "specimen"},
    {"id": "wrong_container", "label": "Incorrect container / wrong tube", "domain": "specimen"},
    {"id": "qns", "label": "Insufficient quantity (QNS)", "domain": "specimen"},
    {"id": "lipemic", "label": "Lipemic sample", "domain": "specimen"},
    {"id": "labeling_error_mismatch", "label": "Mislabeled / Patient ID mismatch", "domain": "specimen"},
    {"id": "transport_delay", "label": "Transport time exceeded", "domain": "specimen"},
    {"id": "labeling_error_unlabeled", "label": "Unlabeled sample", "domain": "specimen"},
]

CORE_KEYWORDS = (
    "specimen rejection",
    "specimen acceptability",
    "specimen condition",
    "specimen unsatisfactory",
    "reason for cancellation",
    "test not performed",
    "hemolysis index",
    "lipemia index",
    "icterus index",
    "observation interpretation",
    "specimen quality",
    "sample quality",
    "reason for unsatisfactory",
    "specimen reject",
    "specimen suitability",
    "sample reject",
    "cancel",
    "unable to test",
    "not tested",
    "rejection reason",
    "specimen adequacy",
)

SEED_LOINC_NUMS = {
    "93048-7",
    "93479-4",
    "74482-1",
    "66483-6",
    "66484-4",
}

SEED_ANSWER_LIST_IDS = {
    "LL5353-9",
    "LL5347-1",
    "LL5433-9",
    "LL6542-6",
    "LL832-7",
    "LL5563-3",
    "LL1574-4",
}

ANSWER_LIST_NAME_PATTERNS = (
    "specimenreject",
    "specimencondition",
    "observationinterpretation",
    "bpu appearance",
    "nbs quality",
    "reasons specimen not collected",
    "specimen not collected",
    "sample unsatisfactory",
    "specimen unsatisfactory",
)

SEED_SPECIMEN_FROM_ANALYTICAL = frozenset({
    "leaked_or_broken_container",
    "not_protected_from_light",
    "overfilled_tube",
})

SEED_SPECIMEN_CATEGORY = {
    "clotted": "specimen_integrity",
    "contaminated": "specimen_integrity",
    "hemolyzed_mild": "serum_index",
    "hemolyzed_moderate": "serum_index",
    "hemolyzed_severe": "serum_index",
    "icteric": "serum_index",
    "lipemic": "serum_index",
    "wrong_container": "identification_labeling",
    "qns": "container_volume",
    "labeling_error_mismatch": "identification_labeling",
    "labeling_error_unlabeled": "identification_labeling",
    "transport_delay": "stability_transport",
    "leaked_or_broken_container": "specimen_integrity",
    "overfilled_tube": "container_volume",
    "not_protected_from_light": "stability_transport",
}

SEED_RESULT_STAGE = {
    "aberrant_clotting_curve_repeat_run": "analytical_qc",
    "ambiguous_identification_repeat_workup": "clinical_review",
    "analyzer_flag_repeat_run_on_same_sample": "analytical_qc",
    "critical_value_repeat_for_verification": "critical_panic",
    "delta_check_failure_repeat_run": "delta_check",
    "equivocal_result_repeat_run": "clinical_review",
    "fasting_requirements_not_met": "linearity_interference",
    "indeterminate_result_repeat_run": "clinical_review",
    "instrument_error_repeat_run": "analytical_qc",
    "insufficient_growth_repeat_incubation": "analytical_qc",
    "invalid_coagulation_control_repeat_run": "analytical_qc",
    "invalid_device_expired_cartridge": "analytical_qc",
    "invalid_or_expired_reagent_repeat_run": "analytical_qc",
    "platelet_clumps_aggregation_flags_repeat_count": "analytical_qc",
    "procedural_error_during_analysis": "analytical_qc",
    "qc_control_failure": "analytical_qc",
}


def reason_id_for_answer(label: str, la: str) -> str:
    if la and re.match(r"^LA\d+-\d$", la):
        return ("la_" + la.replace("-", "_")).lower()
    return slug_id(label)


def slug_id(text: str, prefix: str = "x") -> str:
    s = re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")
    s = re.sub(r"_+", "_", s)
    if not s or not s[0].isalpha():
        s = f"{prefix}_{s}" if s else prefix
    if len(s) > 48:
        s = s[:48].rstrip("_")
    return s


def load_loinc_it() -> dict[str, str]:
    if not IT_VARIANT.is_file():
        return {}
    out: dict[str, str] = {}
    with IT_VARIANT.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            loinc = row.get("LOINC_NUM")
            label = (row.get("LinguisticVariantDisplayName") or row.get("LONG_COMMON_NAME") or "").strip()
            if loinc and label:
                out[loinc] = label
    return out


def discover_loinc_nums() -> set[str]:
    found: set[str] = set(SEED_LOINC_NUMS)
    with LOINC_CORE.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            if row.get("CLASSTYPE") not in {"1", "2"}:
                continue
            blob = f"{row.get('COMPONENT','')} {row.get('LONG_COMMON_NAME','')}".lower()
            if any(k in blob for k in CORE_KEYWORDS):
                found.add(row["LOINC_NUM"])
            if row.get("PROPERTY") == "Imp" and "interpretation" in blob:
                found.add(row["LOINC_NUM"])
    return found


def discover_answer_list_ids(_loinc_nums: set[str]) -> tuple[set[str], set[str]]:
    """Return (specimen-oriented list ids, result-interpretation list ids)."""
    specimen_lists: set[str] = set(SEED_ANSWER_LIST_IDS) - {"LL5433-9"}
    result_lists: set[str] = {"LL5433-9"}
    with ANSWER_LINK.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            ln = row.get("LoincNumber") or row.get("LOINC_NUM")
            if ln not in SEED_LOINC_NUMS:
                continue
            lid = row["AnswerListId"]
            name = (row.get("AnswerListName") or "").lower()
            if "interpret" in name or lid == "LL5433-9":
                result_lists.add(lid)
            else:
                specimen_lists.add(lid)
    with ANSWER_LIST.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            name = (row.get("AnswerListName") or "").lower().replace("_", " ")
            if any(p in name for p in ANSWER_LIST_NAME_PATTERNS):
                if "interpret" in name and "observationinterpretation" in name.replace(" ", ""):
                    result_lists.add(row["AnswerListId"])
                elif "interpret" not in name:
                    specimen_lists.add(row["AnswerListId"])
            if "interpret" in name and any(
                w in name
                for w in (
                    "troponin",
                    "platelet",
                    "coag",
                    "culture",
                    "syph",
                    "clinical factors",
                    "delta",
                    "factor",
                    "pain score",
                )
            ):
                result_lists.add(row["AnswerListId"])
    return specimen_lists, result_lists


def index_answer_lists(list_ids: set[str]) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = defaultdict(list)
    headers: dict[str, dict] = {}
    with ANSWER_LIST.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            lid = row["AnswerListId"]
            if lid not in list_ids:
                continue
            if not row.get("AnswerStringId"):
                headers[lid] = row
                continue
            grouped[lid].append(row)
    return grouped, headers


def classify_sample_category(label: str, list_name: str) -> str:
    low = label.lower()
    lname = list_name.lower()
    if any(w in low for w in ("hemoly", "icter", "lactescent", "lipemi", "bilirubin index")):
        return "serum_index"
    if any(w in low for w in ("clot", "contaminat", "leaked", "broken", "no blood", "layered")):
        return "specimen_integrity"
    if any(w in low for w in ("qns", "quantity", "insufficient", "overfilled", "diluted", "supersaturated")):
        return "container_volume"
    if any(w in low for w in ("label", "mismatch", "unlabeled", "wrong", "container", "tube", "misident")):
        return "identification_labeling"
    if any(w in low for w in ("transport", "expired", "delay", "storage", "dry before", "light")):
        return "stability_transport"
    if "nbs" in lname or "specimen" in lname:
        return "specimen_integrity"
    if "bpu" in lname or "appearance" in lname:
        return "serum_index"
    return "specimen_integrity"


def classify_result_stage(label: str, list_name: str) -> str:
    low = label.lower()
    if "delta" in low:
        return "delta_check"
    if any(w in low for w in ("critical", "panic", "alert")):
        return "critical_panic"
    if any(w in low for w in ("qc", "control", "instrument", "reagent", "procedural", "analyzer")):
        return "analytical_qc"
    if any(w in low for w in ("hemoly", "lipemi", "icter", "fasting", "interference", "lipemia")):
        return "linearity_interference"
    if any(w in low for w in ("equivocal", "indeterminate", "ambiguous", "borderline", "review")):
        return "clinical_review"
    if "interpretation" in list_name.lower():
        return "clinical_review"
    return "analytical_qc"


def add_reason(
    bucket: dict[str, dict],
    entry: dict,
) -> None:
    rid = entry["id"]
    if rid in bucket:
        prev = bucket[rid]
        if entry.get("loinc_answer_id") and not prev.get("loinc_answer_id"):
            bucket[rid] = {**prev, **entry}
        return
    bucket[rid] = entry


def build_sample_registry(
    grouped: dict,
    headers: dict,
    it_loinc: dict[str, str],
    list_ids: set[str],
) -> list[dict]:
    out: dict[str, dict] = {}

    for row in ATLAS_SEED_REASONS:
        domain = row.get("domain")
        rid = row["id"]
        if domain != "specimen" and rid not in SEED_SPECIMEN_FROM_ANALYTICAL:
            continue
        add_reason(
            out,
            {
                "id": rid,
                "code": row["id"].upper()[:12],
                "label": row["label"],
                "category": SEED_SPECIMEN_CATEGORY.get(
                    rid,
                    "stability_transport" if rid in SEED_SPECIMEN_FROM_ANALYTICAL else "specimen_integrity",
                ),
                "requires_recollection": True,
                "description": "Atlas baseline specimen rejection (pre-analytical)",
                "source": "atlas.seed",
            },
        )

    all_list_ids = (set(grouped) | set(headers)) & list_ids
    for lid in sorted(all_list_ids):
        rows = grouped.get(lid, [])
        list_name = rows[0]["AnswerListName"] if rows else headers.get(lid, {}).get("AnswerListName", lid)
        hdr = headers.get(lid, {})
        ext_link = hdr.get("ExtDefinedAnswerListLink") or ""
        if not rows and hdr:
            rid = slug_id(list_name, "loinc_list")
            add_reason(
                out,
                {
                    "id": rid,
                    "code": hdr.get("ExtDefinedAnswerListCodeSystem") or lid,
                    "label": list_name,
                    "category": "specimen_integrity",
                    "requires_recollection": True,
                    "description": f"LOINC external answer list {lid}; values defined at {ext_link}".strip(),
                    "loinc_answer_list_id": lid,
                    "source": "loinc.external_answer_list",
                },
            )
            continue
        for row in sorted(rows, key=lambda r: int(r.get("SequenceNumber") or 0)):
            label = (row.get("DisplayText") or "").strip()
            if not label:
                continue
            la = row.get("AnswerStringId") or ""
            code = (row.get("LocalAnswerCode") or row.get("ExtCodeId") or la or lid)[:64]
            rid = reason_id_for_answer(label, la)
            add_reason(
                out,
                {
                    "id": rid,
                    "code": code,
                    "label": label,
                    "loinc_answer_id": la if re.match(r"^LA\d+-\d$", la) else None,
                    "category": classify_sample_category(label, list_name),
                    "requires_recollection": True,
                    "loinc_answer_list_id": lid,
                    "source": "loinc.answer_list",
                },
            )
            it = it_loinc.get(la)
            if it:
                out[rid]["label_it"] = it

    return sorted(out.values(), key=lambda r: r["id"])


def build_result_registry(grouped: dict, headers: dict, list_ids: set[str]) -> list[dict]:
    out: dict[str, dict] = {}

    for row in ATLAS_SEED_REASONS:
        if row.get("domain") != "analytical":
            continue
        rid = row["id"]
        add_reason(
            out,
            {
                "id": rid,
                "code": rid.upper()[:16],
                "label": row["label"],
                "stage": SEED_RESULT_STAGE.get(rid, "analytical_qc"),
                "blocks_autoverification": True,
                "description": "Atlas baseline analytical validation rejection",
                "source": "atlas.seed",
            },
        )

    interp_lists = {lid for lid in list_ids if lid in grouped or lid in headers}
    for lid in sorted(interp_lists):
        rows = grouped.get(lid, [])
        hdr = headers.get(lid, {})
        if not rows and hdr:
            add_reason(
                out,
                {
                    "id": slug_id(hdr.get("AnswerListName", lid), "loinc_list"),
                    "code": hdr.get("ExtDefinedAnswerListCodeSystem") or lid,
                    "label": hdr.get("AnswerListName") or lid,
                    "stage": "clinical_review",
                    "blocks_autoverification": True,
                    "description": hdr.get("ExtDefinedAnswerListLink") or "",
                    "loinc_answer_list_id": lid,
                    "source": "loinc.external_answer_list",
                },
            )
            continue
        list_name = rows[0]["AnswerListName"] if rows else hdr.get("AnswerListName", lid)
        for row in rows:
            label = (row.get("DisplayText") or "").strip()
            if not label:
                continue
            la = row.get("AnswerStringId") or ""
            code = (row.get("LocalAnswerCode") or row.get("ExtCodeId") or la or label)[:64]
            rid = reason_id_for_answer(label, la)
            add_reason(
                out,
                {
                    "id": rid,
                    "code": code,
                    "label": label,
                    "loinc_answer_id": la if re.match(r"^LA\d+-\d$", la) else None,
                    "stage": classify_result_stage(label, list_name),
                    "blocks_autoverification": True,
                    "loinc_answer_list_id": lid,
                    "source": "loinc.answer_list",
                },
            )

    return sorted(out.values(), key=lambda r: r["id"])


def main() -> None:
    if not LOINC_CORE.is_file():
        print("LOINC 2.83 not found", file=sys.stderr)
        sys.exit(1)
    loinc_nums = discover_loinc_nums()
    specimen_list_ids, result_list_ids = discover_answer_list_ids(loinc_nums)
    all_list_ids = specimen_list_ids | result_list_ids
    grouped, headers = index_answer_lists(all_list_ids)
    it_loinc = load_loinc_it()

    sample_reasons = build_sample_registry(grouped, headers, it_loinc, specimen_list_ids)
    result_reasons = build_result_registry(grouped, headers, result_list_ids)

    sample_doc = {
        "$schema": "./sample-rejection-reasons.schema.json",
        "loinc_discovery": {
            "loinc_terms_matched": len(loinc_nums),
            "answer_lists": len(all_list_ids),
            "specimen_lists": len(specimen_list_ids),
            "result_lists": len(result_list_ids),
        },
        "reasons": [{k: v for k, v in r.items() if v is not None} for r in sample_reasons],
    }
    result_doc = {
        "$schema": "./result-rejection-reasons.schema.json",
        "loinc_discovery": {
            "loinc_terms_matched": len(loinc_nums),
            "answer_lists": len(all_list_ids),
            "result_lists": len(result_list_ids),
        },
        "reasons": [{k: v for k, v in r.items() if v is not None} for r in result_reasons],
    }

    (REG_DIR / "sample-rejection-reasons.json").write_text(
        json.dumps(sample_doc, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    (REG_DIR / "result-rejection-reasons.json").write_text(
        json.dumps(result_doc, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(
        f"sample reasons: {len(sample_reasons)} "
        f"(LOINC terms {len(loinc_nums)}, specimen lists {len(specimen_list_ids)}, result lists {len(result_list_ids)})"
    )
    print(f"result reasons: {len(result_reasons)}")


if __name__ == "__main__":
    main()