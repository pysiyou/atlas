#!/usr/bin/env python3
"""
Fill casual (in-reference) lab results for a collected sample + orderable test.

Uses the same domain path as manual/analyzer entry (LabOperationsService.enter_results),
not raw SQL.

Currently supported generators:
  - CBC  — Complete Blood Count (CBC) with automated differential

Run from repository root (needs DB + backend on PYTHONPATH):

  python scripts/fill_casual_lab_results.py \\
    --sample-id 26-00006 \\
    --test-code CBC \\
    --patient-id 30000037

  python scripts/fill_casual_lab_results.py ... --dry-run --seed 42
"""
from __future__ import annotations

import argparse
import json
import random
import sys
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any, Callable

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

import app.domains.registry  # noqa: E402,F401 — register ORM models
from app.domains.catalog.service import analyte_definitions_for_test  # noqa: E402
from app.domains.lab.rules.state_machines import TestStateMachine  # noqa: E402
from app.domains.lab.workflow.constants import ANALYZER_USER_ID  # noqa: E402
from app.domains.lab.workflow.operations import LabOperationsService  # noqa: E402
from app.domains.orders.models import Order, OrderTest  # noqa: E402
from app.domains.patients.models import Patient  # noqa: E402
from app.domains.lab.specimen.lookup import (
    find_enterable_order_test,
    latest_order_test_on_sample_chain,
)
from app.domains.lab.specimen.models import Sample  # noqa: E402
from app.shared.errors import LabOperationError  # noqa: E402
from app.shared.generated.enums import Gender  # noqa: E402
from app.shared.ranges import band_low_high, resolve_reference_band  # noqa: E402
from app.platform.database import SessionLocal  # noqa: E402

# ---------------------------------------------------------------------------
# Patient + reference helpers
# ---------------------------------------------------------------------------


def patient_age_years(dob: str | None) -> int | None:
    if not dob:
        return None
    try:
        if "T" in dob:
            born = datetime.fromisoformat(dob.replace("Z", "+00:00")).date()
        else:
            born = datetime.strptime(dob[:10], "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None
    today = date.today()
    age = today.year - born.year
    if (today.month, today.day) < (born.month, born.day):
        age -= 1
    return age


def patient_gender_str(patient: Patient | None) -> str | None:
    if not patient or not patient.gender:
        return None
    if patient.gender == Gender.MALE:
        return "male"
    if patient.gender == Gender.FEMALE:
        return "female"
    return None


@dataclass(frozen=True)
class PatientContext:
    patient_id: str
    gender: str | None
    age_years: int | None


def catalog_bounds(
    analyte_def: dict[str, Any],
    ctx: PatientContext,
) -> tuple[float | None, float | None, str | None]:
    """Resolve numeric low/high (or SELECT text hint) for this patient."""
    band = resolve_reference_band(
        analyte_def.get("reference_range") or {},
        gender=ctx.gender,
        age=ctx.age_years,
    )
    text = band.get("text")
    if text:
        return None, None, str(text).strip()
    low, high = band_low_high(band)
    return low, high, None


def round_numeric(value: float, decimals: int | None) -> float | int:
    if decimals is None:
        return value
    if decimals <= 0:
        return int(round(value))
    return round(value, decimals)


def casual_in_range(
    rng: random.Random,
    low: float | None,
    high: float | None,
    *,
    inset: float = 0.12,
    decimals: int | None = 2,
) -> float:
    """
    Pick a numeric value inside the reference interval (with an inset so flags stay NORMAL).

    If only one bound exists, nudge slightly inside from that bound.
    """
    if low is not None and high is not None:
        if high <= low:
            return round_numeric(low, decimals)
        span = high - low
        margin = span * inset
        inner_low = low + margin
        inner_high = high - margin
        if inner_high <= inner_low:
            inner_low, inner_high = low, high
        value = rng.uniform(inner_low, inner_high)
        return float(round_numeric(value, decimals))

    if low is not None:
        bump = abs(low) * 0.05 + 0.1
        value = low + bump
        return float(round_numeric(value, decimals))

    if high is not None:
        bump = abs(high) * 0.05 + 0.1
        value = high - bump
        return float(round_numeric(value, decimals))

    return float(round_numeric(rng.uniform(1.0, 10.0), decimals))


def casual_value_for_analyte(
    analyte_def: dict[str, Any],
    ctx: PatientContext,
    rng: random.Random,
) -> Any:
    code = analyte_def.get("analyte_code") or "?"
    value_type = (analyte_def.get("value_type") or "NUMERIC").upper()
    decimals = analyte_def.get("decimals_suggested")

    if value_type == "SELECT":
        allowed = analyte_def.get("allowed_values") or []
        if not allowed:
            return "Negative"
        preferred = [v for v in allowed if str(v).lower() in ("negative", "normal", "not detected")]
        pool = preferred or allowed
        return rng.choice(pool)

    if value_type == "TEXT":
        _low, _high, text = catalog_bounds(analyte_def, ctx)
        return text or "See comment"

    low, high, text = catalog_bounds(analyte_def, ctx)
    if text and low is None and high is None:
        return text

    if low is None and high is None:
        raise ValueError(f"No reference band for numeric analyte {code}")

    return casual_in_range(rng, low, high, decimals=decimals)


# ---------------------------------------------------------------------------
# Test-specific generators
# ---------------------------------------------------------------------------

CBC_CORE_ANALYTES = (
    "WBC",
    "RBC",
    "HGB",
    "HCT",
    "MCV",
    "MCH",
    "MCHC",
    "RDW",
    "PLAT",
    "MPV",
)
CBC_PERCENT_ANALYTES = ("NEUTP", "LYMPHP", "MONOP", "EOSP", "BASOP")
CBC_ABSOLUTE_ANALYTES = ("NEUTA", "LYMPHA", "MONOA", "EOSA", "BASOA")


def _defs_by_code(definitions: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for item in definitions:
        code = item.get("analyte_code")
        if code:
            out[code] = item
    return out


def _clamp_to_reference(
    value: float,
    analyte_def: dict[str, Any],
    ctx: PatientContext,
    decimals: int | None,
) -> float:
    low, high, _ = catalog_bounds(analyte_def, ctx)
    if low is not None:
        value = max(value, low)
    if high is not None:
        value = min(value, high)
    return float(round_numeric(value, decimals))


def generate_cbc_results(
    definitions: list[dict[str, Any]],
    ctx: PatientContext,
    rng: random.Random,
) -> dict[str, Any]:
    """CBC panel: core indices in-range; differential % normalized to ~100; absolutes from WBC."""
    by_code = _defs_by_code(definitions)
    results: dict[str, Any] = {}

    for code in CBC_CORE_ANALYTES:
        item = by_code.get(code)
        if not item:
            continue
        results[code] = casual_value_for_analyte(item, ctx, rng)

    wbc = float(results.get("WBC", casual_in_range(rng, 4.0, 10.5, decimals=2)))
    results["WBC"] = wbc

    percent_values: list[float] = []
    for code in CBC_PERCENT_ANALYTES:
        item = by_code.get(code)
        if not item:
            continue
        low, high, _ = catalog_bounds(item, ctx)
        percent_values.append(
            casual_in_range(rng, low, high, inset=0.08, decimals=item.get("decimals_suggested", 1))
        )

    if percent_values:
        total = sum(percent_values)
        if total <= 0:
            total = 100.0
        normalized = [p / total * 100.0 for p in percent_values]
        for code, raw in zip(CBC_PERCENT_ANALYTES, normalized):
            item = by_code.get(code)
            if not item:
                continue
            dec = item.get("decimals_suggested", 1)
            results[code] = float(round_numeric(raw, dec))

        diff_sum = sum(float(results[c]) for c in CBC_PERCENT_ANALYTES if c in results)
        if diff_sum and abs(diff_sum - 100.0) > 0.05:
            adjust_code = CBC_PERCENT_ANALYTES[0]
            if adjust_code in results:
                results[adjust_code] = float(
                    round_numeric(float(results[adjust_code]) + (100.0 - diff_sum), dec=1)
                )

    for p_code, a_code in zip(CBC_PERCENT_ANALYTES, CBC_ABSOLUTE_ANALYTES):
        if p_code not in results:
            continue
        abs_item = by_code.get(a_code)
        if not abs_item:
            continue
        derived = wbc * float(results[p_code]) / 100.0
        dec = abs_item.get("decimals_suggested", 2)
        results[a_code] = _clamp_to_reference(derived, abs_item, ctx, dec)

    missing = [
        code
        for code in (list(CBC_CORE_ANALYTES) + list(CBC_PERCENT_ANALYTES) + list(CBC_ABSOLUTE_ANALYTES))
        if code in by_code and code not in results
    ]
    for code in missing:
        results[code] = casual_value_for_analyte(by_code[code], ctx, rng)

    return results


def generate_generic_results(
    definitions: list[dict[str, Any]],
    ctx: PatientContext,
    rng: random.Random,
) -> dict[str, Any]:
    results: dict[str, Any] = {}
    for item in definitions:
        code = item.get("analyte_code")
        if not code:
            continue
        results[code] = casual_value_for_analyte(item, ctx, rng)
    return results


TestGenerator = Callable[[list[dict[str, Any]], PatientContext, random.Random], dict[str, Any]]

GENERATORS: dict[str, TestGenerator] = {
    "CBC": generate_cbc_results,
}


# ---------------------------------------------------------------------------
# Lookup + mutation
# ---------------------------------------------------------------------------


@dataclass
class ResolveWorkContext:
    """Resolved DB rows plus eligibility for result entry."""

    sample: Sample | None
    order: Order | None
    order_test: OrderTest | None
    warnings: list[str]

    @property
    def can_enter_results(self) -> bool:
        if not self.order_test:
            return False
        ok, _reason = TestStateMachine.can_enter_results(self.order_test.status)
        return ok


def resolve_work_context(
    db,
    *,
    sample_id: str,
    test_code: str,
    patient_id: str,
    strict_eligibility: bool,
) -> ResolveWorkContext:
    """
    Resolve sample / order / order-test line.

    When ``strict_eligibility`` is False (dry-run), always returns the best-matching
    order test if any exists and records warnings instead of exiting.
    """
    warnings: list[str] = []
    sample = db.query(Sample).filter(Sample.sampleId == sample_id).first()
    if not sample:
        warnings.append(f"Sample not found: {sample_id}")
        return ResolveWorkContext(sample=None, order=None, order_test=None, warnings=warnings)

    order = db.query(Order).filter(Order.orderId == sample.orderId).first()
    if not order:
        warnings.append(f"Order not found for sample {sample_id}")
        return ResolveWorkContext(sample=sample, order=None, order_test=None, warnings=warnings)

    if order.patientId != patient_id:
        warnings.append(
            f"Patient mismatch: sample order belongs to {order.patientId}, not {patient_id}"
        )

    code = test_code.upper()
    order_test = find_enterable_order_test(db, sample, code)
    if order_test and order_test.sampleId and order_test.sampleId != sample_id:
        successor = db.query(Sample).filter(Sample.sampleId == order_test.sampleId).first()
        warnings.append(
            f"Sample {sample_id} {code} lineage is superseded; using recollection "
            f"sample {order_test.sampleId} (orderTestId={order_test.id})."
        )
        if successor:
            sample = successor
    if not order_test:
        order_test = latest_order_test_on_sample_chain(db, sample, code)
        if not order_test:
            order_test = (
                db.query(OrderTest)
                .filter(
                    OrderTest.orderId == sample.orderId,
                    OrderTest.testCode == code,
                )
                .order_by(OrderTest.id.desc())
                .first()
            )
            if order_test:
                warnings.append(
                    f"Order test {code} exists on order {order.orderId} but is not linked to "
                    f"sample {sample_id} (using orderTestId={order_test.id})."
                )
            else:
                warnings.append(
                    f"No order test '{code}' on order {order.orderId} for sample {sample_id}."
                )

    ctx = ResolveWorkContext(
        sample=sample, order=order, order_test=order_test, warnings=warnings
    )
    if order_test:
        can_enter, reason = TestStateMachine.can_enter_results(order_test.status)
        if not can_enter:
            msg = (
                f"Order test {code} (id={order_test.id}) is status "
                f"'{order_test.status.value}' — cannot enter results"
            )
            if reason:
                msg += f": {reason}"
            warnings.append(msg)
            if strict_eligibility:
                raise SystemExit(msg)

    if strict_eligibility and not order_test:
        detail = warnings[-1] if warnings else f"No eligible order test for {code}."
        raise SystemExit(detail)

    return ctx


def load_patient_context(
    db,
    patient_id: str,
    *,
    allow_missing: bool = False,
) -> tuple[PatientContext, list[str]]:
    warnings: list[str] = []
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        if allow_missing:
            warnings.append(f"Patient not found: {patient_id} (using generic reference bands).")
            return (
                PatientContext(patient_id=patient_id, gender=None, age_years=None),
                warnings,
            )
        raise SystemExit(f"Patient not found: {patient_id}")
    return (
        PatientContext(
            patient_id=patient_id,
            gender=patient_gender_str(patient),
            age_years=patient_age_years(patient.dateOfBirth),
        ),
        warnings,
    )


def generate_results_for_test(
    test_code: str,
    definitions: list[dict[str, Any]],
    ctx: PatientContext,
    rng: random.Random,
) -> dict[str, Any]:
    generator = GENERATORS.get(test_code.upper())
    if generator:
        return generator(definitions, ctx, rng)
    if not definitions:
        raise SystemExit(f"No analyte definitions in catalog for test {test_code}")
    return generate_generic_results(definitions, ctx, rng)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Enter casual in-reference lab results for a collected sample.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--sample-id", required=True, help="Sample accession id (e.g. 26-00006)")
    parser.add_argument("--test-code", default="CBC", help="Orderable test code")
    parser.add_argument("--patient-id", required=True, help="Patient MRN (8-digit id)")
    parser.add_argument(
        "--entered-by",
        default=ANALYZER_USER_ID,
        help="User id stored as enteredBy (analyzer default)",
    )
    parser.add_argument("--technician-notes", default="Casual auto-fill (dev script)", help="Technician notes")
    parser.add_argument("--seed", type=int, default=None, help="RNG seed for reproducible values")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print preview JSON (generated results + warnings); never writes to DB",
    )
    parser.add_argument(
        "--list-supported",
        action="store_true",
        help="List test codes with dedicated generators and exit",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.list_supported:
        print("Dedicated generators:", ", ".join(sorted(GENERATORS.keys())))
        print("Other tests fall back to generic per-analyte in-reference values.")
        return 0

    test_code = args.test_code.strip().upper()
    rng = random.Random(args.seed)

    db = SessionLocal()
    try:
        work = resolve_work_context(
            db,
            sample_id=args.sample_id.strip(),
            test_code=test_code,
            patient_id=args.patient_id.strip(),
            strict_eligibility=not args.dry_run,
        )
        ctx, patient_warnings = load_patient_context(
            db,
            args.patient_id.strip(),
            allow_missing=args.dry_run,
        )
        preview_warnings = list(work.warnings) + patient_warnings

        definitions = analyte_definitions_for_test(db, test_code)
        if not definitions:
            if args.dry_run:
                preview_warnings.append(
                    f"Test {test_code} has no analytes in DB catalog "
                    "(sync orderable tests / analytes)."
                )
                print(
                    json.dumps(
                        {
                            "dryRun": True,
                            "canEnterResults": False,
                            "warnings": preview_warnings,
                            "sampleId": args.sample_id.strip(),
                            "patientId": args.patient_id.strip(),
                            "testCode": test_code,
                            "results": None,
                        },
                        indent=2,
                    )
                )
                return 0
            raise SystemExit(
                f"Test {test_code} has no analytes in DB catalog "
                "(sync orderable tests / analytes)."
            )

        results = generate_results_for_test(test_code, definitions, ctx, rng)

        order_test = work.order_test
        order = work.order
        sample = work.sample

        payload: dict[str, Any] = {
            "dryRun": args.dry_run,
            "canEnterResults": work.can_enter_results,
            "warnings": preview_warnings,
            "orderTestId": order_test.id if order_test else None,
            "orderTestStatus": order_test.status.value if order_test else None,
            "orderId": order.orderId if order else None,
            "sampleId": sample.sampleId if sample else args.sample_id.strip(),
            "patientId": order.patientId if order else args.patient_id.strip(),
            "testCode": test_code,
            "patientContext": {
                "gender": ctx.gender,
                "ageYears": ctx.age_years,
            },
            "results": results,
        }

        if args.dry_run:
            print(json.dumps(payload, indent=2))
            return 0

        if not work.can_enter_results or not order_test:
            detail = preview_warnings[-1] if preview_warnings else "Cannot enter results."
            raise SystemExit(detail)

        service = LabOperationsService(db)
        try:
            updated = service.enter_results(
                order_test_id=order_test.id,
                user_id=args.entered_by,
                results=results,
                technician_notes=args.technician_notes,
            )
        except LabOperationError as exc:
            print(f"Lab operation failed ({exc.error_code}): {exc.message}", file=sys.stderr)
            return 1

        payload["status"] = updated.status.value
        payload["storedResults"] = updated.results
        print(json.dumps(payload, indent=2))
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())