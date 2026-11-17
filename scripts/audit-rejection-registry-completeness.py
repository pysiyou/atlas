#!/usr/bin/env python3
"""
Completeness audit: LOINC 2.83 AnswerList sources vs Atlas rejection registries + catalog coverage.
Exit 0 only when zero missing AnswerStringId/ExtCodeId rows and full catalog criteria coverage.
"""
from __future__ import annotations

import csv
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOINC_ROOT = ROOT.parent / "Loinc_2.83"
ANSWER_LIST = LOINC_ROOT / "AccessoryFiles/AnswerFile/AnswerList.csv"
ANSWER_LINK = LOINC_ROOT / "AccessoryFiles/AnswerFile/LoincAnswerListLink.csv"
SAMPLE_REG = ROOT / "contracts/registries/sample-rejection-reasons.json"
RESULT_REG = ROOT / "contracts/registries/result-rejection-reasons.json"
TESTS = ROOT / "contracts/catalog/orderable-tests.json"
ANALYTES = ROOT / "contracts/catalog/analyte-catalog.json"

# Mirrors scripts/build-rejection-registries-from-loinc.py discovery
SEED_LOINC = {"93048-7", "93479-4", "74482-1", "66483-6", "66484-4"}
SEED_LISTS = {"LL5353-9", "LL5347-1", "LL5433-9", "LL6542-6", "LL832-7", "LL5563-3", "LL1574-4"}
NAME_PATTERNS = (
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
INTERP_LAB = (
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
SPECIMEN_ONLY_LISTS = {"LL5353-9", "LL5347-1", "LL6542-6", "LL832-7", "LL5563-3", "LL1574-4"}
RESULT_ONLY_LISTS = {"LL5433-9"}


def discover_list_ids() -> set[str]:
    ids = set(SEED_LISTS)
    with ANSWER_LINK.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            ln = row.get("LoincNumber") or row.get("LOINC_NUM")
            if ln in SEED_LOINC:
                ids.add(row["AnswerListId"])
    with ANSWER_LIST.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            name = (row.get("AnswerListName") or "").lower().replace("_", " ")
            if any(p in name for p in NAME_PATTERNS):
                ids.add(row["AnswerListId"])
            if "interpret" in name and any(w in name for w in INTERP_LAB):
                ids.add(row["AnswerListId"])
    return ids


def collect_source_rows(list_ids: set[str]) -> tuple[list[dict], dict[str, dict]]:
    headers: dict[str, dict] = {}
    rows: list[dict] = []
    with ANSWER_LIST.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            lid = row["AnswerListId"]
            if lid not in list_ids:
                continue
            if not row.get("AnswerStringId"):
                headers[lid] = row
                continue
            rows.append(row)
    return rows, headers


def registry_index() -> tuple[set[str], set[str], set[str], set[str]]:
    sample = json.loads(SAMPLE_REG.read_text(encoding="utf-8"))
    result = json.loads(RESULT_REG.read_text(encoding="utf-8"))
    sample_la: set[str] = set()
    result_la: set[str] = set()
    sample_ext: set[str] = set()
    result_ext: set[str] = set()
    sample_lists: set[str] = set()
    result_lists: set[str] = set()
    for r in sample.get("reasons", []):
        if r.get("loinc_answer_id"):
            sample_la.add(r["loinc_answer_id"])
        if r.get("loinc_answer_list_id"):
            sample_lists.add(r["loinc_answer_list_id"])
        code = str(r.get("code") or "")
        if code and not code.startswith("LA"):
            sample_ext.add(code)
        if code.startswith("LA"):
            sample_la.add(code)
    for r in result.get("reasons", []):
        if r.get("loinc_answer_id"):
            result_la.add(r["loinc_answer_id"])
        if r.get("loinc_answer_list_id"):
            result_lists.add(r["loinc_answer_list_id"])
        code = str(r.get("code") or "")
        if code and not code.startswith("LA"):
            result_ext.add(code)
        if code.startswith("LA"):
            result_la.add(code)
    all_la = sample_la | result_la
    all_ext = sample_ext | result_ext
    return all_la, all_ext, sample_lists, result_lists


def expected_bucket(lid: str) -> str:
    if lid in SPECIMEN_ONLY_LISTS:
        return "sample"
    if lid in RESULT_ONLY_LISTS:
        return "result"
    return "either"


def main() -> int:
    if not ANSWER_LIST.is_file():
        print("LOINC AnswerList.csv not found", file=sys.stderr)
        return 1

    list_ids = discover_list_ids()
    source_rows, headers = collect_source_rows(list_ids)
    all_la, all_ext, sample_lists, result_lists = registry_index()

    source_la = {r["AnswerStringId"] for r in source_rows}
    source_ext = {r["ExtCodeId"].strip() for r in source_rows if r.get("ExtCodeId", "").strip()}

    missing_la = sorted(source_la - all_la)
    missing_ext = sorted(source_ext - all_ext)

    missing_external_lists: list[str] = []
    for lid in sorted(list_ids):
        if headers.get(lid) and not source_rows and lid not in (sample_lists | result_lists):
            missing_external_lists.append(lid)

    tests = json.loads(TESTS.read_text(encoding="utf-8")).get("tests", [])
    analytes = json.loads(ANALYTES.read_text(encoding="utf-8")).get("analytes", [])
    empty_sample = [
        t.get("test_code")
        for t in tests
        if not (isinstance(t.get("sample"), dict) and t["sample"].get("rejection_criteria"))
    ]
    def _validation_ids(row: dict) -> list:
        validation = row.get("validation")
        if isinstance(validation, dict):
            return validation.get("rejection_criteria") or []
        return []

    empty_test_val = [t.get("test_code") for t in tests if not _validation_ids(t)]
    empty_analyte_val = [a.get("analyte_code") for a in analytes if not _validation_ids(a)]

    sample_n = len(json.loads(SAMPLE_REG.read_text())["reasons"])
    result_n = len(json.loads(RESULT_REG.read_text())["reasons"])

    print("=== Rejection registry completeness audit ===")
    print(f"Source answer lists (scoped): {len(list_ids)}")
    print(f"Source AnswerStringId (LA) rows: {len(source_la)}")
    print(f"Source ExtCodeId values: {len(source_ext)}")
    print(f"External list headers (no inlined LA rows): {len([lid for lid in list_ids if headers.get(lid) and lid not in {r['AnswerListId'] for r in source_rows}])}")
    print(f"Registry sample reasons: {sample_n}")
    print(f"Registry result reasons: {result_n}")
    print(f"Registry LA coverage: {len(source_la & all_la)}/{len(source_la)}")
    print(f"Registry ExtCode coverage: {len(source_ext & all_ext)}/{len(source_ext)}")
    print(f"Missing LA codes: {len(missing_la)}")
    print(f"Missing ExtCodeId values: {len(missing_ext)}")
    print(f"Missing external list metadata: {len(missing_external_lists)}")
    print(f"Catalog empty sample.rejection_criteria: {len(empty_sample)}")
    print(f"Catalog empty test validation.rejection_criteria: {len(empty_test_val)}")
    print(f"Catalog empty analyte validation.rejection_criteria: {len(empty_analyte_val)}")

    if missing_la:
        print("\nMissing AnswerStringId (first 20):")
        for la in missing_la[:20]:
            row = next(r for r in source_rows if r["AnswerStringId"] == la)
            print(f"  {la} | {row['DisplayText'][:50]} | {row['AnswerListId']}")

    if missing_external_lists:
        print("\nMissing external HL7/PHIN list stubs:")
        for lid in missing_external_lists:
            print(f"  {lid} | {headers[lid].get('AnswerListName', '')}")

    errors = (
        len(missing_la)
        + len(missing_ext)
        + len(missing_external_lists)
        + len(empty_sample)
        + len(empty_test_val)
        + len(empty_analyte_val)
    )
    if errors:
        print(f"\nAUDIT FAILED ({errors} gap(s))")
        return 1

    print("\nAUDIT PASSED: 0 missing LOINC/HL7 answer codes in scoped lists; catalog fully linked.")

    rc = subprocess.call(["npm", "run", "validate:catalog"], cwd=ROOT / "frontend")
    if rc != 0:
        print("validate:catalog failed", file=sys.stderr)
        return rc
    return 0


if __name__ == "__main__":
    sys.exit(main())