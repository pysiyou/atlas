"""
LIS 6-Month Data Seeding Script

Simulates 6 months of realistic LIS usage: 50 patients, orders with 1-5 tests each,
and backfilled test workflows (completed, after correction, pending validation/result/collection,
escalated) with strict chronology and lab_operation_logs.

Expects: users and tests already seeded (e.g. via init_db: generate_users, generate_tests).
Creates 50 patients and their orders/samples/workflows; called from init_db or standalone.

Usage (from backend directory):
  PYTHONPATH=. poetry run python db_scripts/seed_lis_6months.py [--dry-run] [--seed N]
"""
from __future__ import annotations

import argparse
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.database import SessionLocal
from app.models import Order, OrderTest, Patient, Sample, Test, LabOperationLog
from app.schemas.enums import (
    ContainerTopColor,
    ContainerType,
    LabOperationType,
    OrderStatus,
    PaymentStatus,
    PriorityLevel,
    SampleStatus,
    TestStatus,
)
from app.services.sample_generator import generate_samples_for_order

# Scenario weights (approx): completed 50%, completed_after_correction 10%, pending_validation 10%,
# pending_result 10%, pending_collection 10%, escalated 10%
SCENARIO_WEIGHTS: List[Tuple[str, float]] = [
    ("completed", 0.50),
    ("completed_after_correction", 0.10),
    ("pending_validation", 0.10),
    ("pending_result", 0.10),
    ("pending_collection", 0.10),
    ("escalated", 0.10),
]

START_DATE_OFFSET_DAYS = 180  # 6 months
NUM_PATIENTS = 50
RETURN_PATIENT_FRACTION = 0.40
MIN_ORDERS_PER_PATIENT = 1
MAX_ORDERS_PER_PATIENT = 10
MIN_TESTS_PER_ORDER = 1
MAX_TESTS_PER_ORDER = 5
MAX_RETEST_ATTEMPTS = 3  # After 3 reject_retest, must escalate

# Time deltas (hours) for collection -> result: standard 2-6h, backlog 24-72h, outsourced 168-336h
DELTA_COLLECTION_TO_RESULT_STANDARD = (2, 6)
DELTA_COLLECTION_TO_RESULT_BACKLOG = (24, 72)
DELTA_COLLECTION_TO_RESULT_OUTSOURCED = (168, 336)
# Validation: same day or +1-2 days after result
DELTA_RESULT_TO_VALIDATION_SAME_DAY = (0, 4)
DELTA_RESULT_TO_VALIDATION_DELAYED = (24, 48)


def get_user_ids_by_role(db: Session) -> Dict[str, int]:
    """Return dict of role name -> user id for receptionist, lab-technician, lab-technician-plus."""
    from app.models.user import User
    from app.schemas.enums import UserRole

    users = db.query(User).filter(
        User.role.in_([
            UserRole.RECEPTIONIST,
            UserRole.LAB_TECH,
            UserRole.LAB_TECH_PLUS,
        ])
    ).all()
    role_to_id: Dict[str, int] = {}
    for u in users:
        if u.role == UserRole.RECEPTIONIST:
            role_to_id["receptionist"] = u.id
        elif u.role == UserRole.LAB_TECH:
            role_to_id["labtech"] = u.id
        elif u.role == UserRole.LAB_TECH_PLUS:
            role_to_id["labtech_plus"] = u.id
    return role_to_id


def load_result_items_by_test(db: Session) -> Dict[str, List[Dict[str, Any]]]:
    """Load result_items from Test model keyed by test code."""
    tests = db.query(Test).filter(Test.isActive == True).all()
    return {t.code: (t.resultItems or []) for t in tests}


def _random_dt_in_range(start: datetime, end: datetime) -> datetime:
    delta = end - start
    sec = random.randint(0, max(0, int(delta.total_seconds())))
    return start + timedelta(seconds=sec)


def _add_hours(dt: datetime, low: float, high: float) -> datetime:
    h = random.uniform(low, high)
    return dt + timedelta(hours=h)


def generate_result_values(
    result_items: List[Dict[str, Any]], rng: Optional[random.Random] = None
) -> Dict[str, Any]:
    """Generate a results dict suitable for OrderTest.results from result_items (item_code, value_type, reference_range)."""
    r = rng or random
    out: Dict[str, Any] = {}
    for item in result_items:
        code = item.get("item_code")
        if not code:
            continue
        value_type = (item.get("value_type") or "NUMERIC").upper()
        ref = item.get("reference_range") or {}
        # Use first available range (e.g. adult_general, adult_male)
        low, high = None, None
        for k, v in ref.items():
            if isinstance(v, dict) and "low" in v and "high" in v:
                low = v["low"]
                high = v["high"]
                break
        if value_type == "NUMERIC":
            if low is not None and high is not None:
                decimals = item.get("decimals_suggested", 1)
                val = round(r.uniform(float(low), float(high)), decimals)
            else:
                val = round(r.uniform(0, 100), 2)
            out[code] = val
        elif value_type in ("TEXT", "SELECT"):
            options = item.get("options") or ["Negative", "Positive", "Reactive", "Non-Reactive", "Normal"]
            out[code] = r.choice(options)
        else:
            out[code] = r.choice(["Negative", "Positive", "Normal"])
    return out


def generate_patients_6m(db: Session, count: int = NUM_PATIENTS) -> List[Patient]:
    """Generate count patients with registration dates in [T-6M, T]. Reuses generate_patients logic."""
    from db_scripts.generate_patients import _create_single_patient_data

    now = datetime.now(timezone.utc)
    start = now - timedelta(days=START_DATE_OFFSET_DAYS)
    patients: List[Patient] = []
    for _ in range(count):
        data = _create_single_patient_data()
        data["registrationDate"] = _random_dt_in_range(start, now)
        data["createdBy"] = "1"
        data["updatedBy"] = "1"
        patient = Patient(**data)
        db.add(patient)
        db.flush()
        patients.append(patient)
    return patients


def generate_orders_6m(
    db: Session,
    patients: List[Patient],
    user_ids: Dict[str, int],
) -> List[Order]:
    """Create orders for each patient: at least one on registration day; 40% get 1-9 more (cap 10 total)."""
    all_tests = db.query(Test).filter(Test.isActive == True).all()
    if not all_tests:
        raise ValueError("No tests in database. Run generate_tests first.")

    receptionist_id = user_ids.get("receptionist", 1)
    orders: List[Order] = []
    return_patients = random.sample(patients, max(1, int(len(patients) * RETURN_PATIENT_FRACTION)))

    for patient in patients:
        reg = patient.registrationDate
        if reg.tzinfo is None:
            reg = reg.replace(tzinfo=timezone.utc)
        order_dates: List[datetime] = [reg]
        if patient in return_patients:
            extra = random.randint(1, MAX_ORDERS_PER_PATIENT - 1)
            end = datetime.now(timezone.utc)
            for _ in range(extra):
                order_dates.append(_random_dt_in_range(reg + timedelta(days=1), end))
            order_dates = order_dates[:MAX_ORDERS_PER_PATIENT]

        for order_date in order_dates:
            num_tests = random.randint(MIN_TESTS_PER_ORDER, min(MAX_TESTS_PER_ORDER, len(all_tests)))
            selected = random.sample(all_tests, num_tests)
            total_price = sum(t.price for t in selected)
            order = Order(
                patientId=patient.id,
                orderDate=order_date,
                totalPrice=total_price,
                paymentStatus=PaymentStatus.UNPAID,
                overallStatus=OrderStatus.ORDERED,
                priority=PriorityLevel.LOW,
                createdBy=str(receptionist_id),
            )
            db.add(order)
            db.flush()
            for test in selected:
                ot = OrderTest(
                    orderId=order.orderId,
                    testCode=test.code,
                    status=TestStatus.PENDING,
                    priceAtOrder=test.price,
                )
                db.add(ot)
            db.flush()
            samples = generate_samples_for_order(order.orderId, db, receptionist_id)
            db.flush()
            orders.append(order)
    return orders


def assign_scenario(rng: Optional[random.Random] = None) -> str:
    """Weighted random scenario: completed | completed_after_correction | pending_validation | pending_result | pending_collection | escalated."""
    r = rng or random
    x = r.random()
    cumul = 0.0
    for name, w in SCENARIO_WEIGHTS:
        cumul += w
        if x <= cumul:
            return name
    return "completed"


def build_event_chain(
    scenario: str,
    order_date: datetime,
    rng: Optional[random.Random] = None,
) -> List[Tuple[str, datetime]]:
    """Return ordered list of (event_type, performed_at). event_type: sample_collect, result_entry, result_validation_approve, result_validation_reject_retest, result_validation_escalate."""
    r = rng or random
    if order_date.tzinfo is None:
        order_date = order_date.replace(tzinfo=timezone.utc)
    events: List[Tuple[str, datetime]] = []
    t0 = order_date + timedelta(hours=1)

    if scenario == "pending_collection":
        return []

    # Collection first
    events.append(("sample_collect", t0))
    t_collect = t0

    if scenario == "pending_result":
        return events

    # Collection -> result delay: weighted standard / backlog / outsourced
    which = r.choice(["standard", "backlog", "outsourced"])
    if which == "standard":
        low, high = DELTA_COLLECTION_TO_RESULT_STANDARD
    elif which == "backlog":
        low, high = DELTA_COLLECTION_TO_RESULT_BACKLOG
    else:
        low, high = DELTA_COLLECTION_TO_RESULT_OUTSOURCED
    t_result = _add_hours(t_collect, low, high)
    events.append(("result_entry", t_result))

    if scenario == "pending_validation":
        return events

    if scenario == "completed":
        # Validation same day or +1-2 days
        if r.random() < 0.8:
            low, high = DELTA_RESULT_TO_VALIDATION_SAME_DAY
        else:
            low, high = DELTA_RESULT_TO_VALIDATION_DELAYED
        t_val = _add_hours(t_result, low, high)
        events.append(("result_validation_approve", t_val))
        return events

    if scenario == "completed_after_correction":
        # One reject_retest then result then approve
        t_reject1 = _add_hours(t_result, 1, 4)
        events.append(("result_validation_reject_retest", t_reject1))
        t_result2 = _add_hours(t_reject1, 2, 6)
        events.append(("result_entry", t_result2))
        t_val = _add_hours(t_result2, 0, 4)
        events.append(("result_validation_approve", t_val))
        return events

    if scenario == "escalated":
        # 3x (result_entry, reject_retest) then result_entry then escalate
        # First result_entry already added; so: reject, result, reject, result, reject, result, escalate
        t = t_result
        for _ in range(MAX_RETEST_ATTEMPTS):
            t = _add_hours(t, 1, 4)
            events.append(("result_validation_reject_retest", t))
            t = _add_hours(t, 2, 6)
            events.append(("result_entry", t))
        t = _add_hours(t, 1, 4)
        events.append(("result_validation_escalate", t))
        return events

    return events


def _ensure_sample_collected(
    db: Session,
    sample: Sample,
    order_id: int,
    test_codes: List[str],
    performed_at: datetime,
    user_id: int,
) -> None:
    """Set sample to COLLECTED and link OrderTests; insert lab_operation_log with performedAt."""
    from app.models.order import OrderTest

    before = {
        "sampleId": sample.sampleId,
        "status": sample.status.value if sample.status else None,
    }
    sample.status = SampleStatus.COLLECTED
    sample.collectedAt = performed_at
    sample.collectedBy = str(user_id)
    sample.collectedVolume = sample.requiredVolume or 5.0
    sample.remainingVolume = sample.requiredVolume or 5.0
    # Container: use first required if available
    if sample.requiredContainerTypes:
        try:
            sample.actualContainerType = ContainerType(sample.requiredContainerTypes[0])
        except (ValueError, TypeError):
            sample.actualContainerType = ContainerType.TUBE
    else:
        sample.actualContainerType = ContainerType.TUBE
    if sample.requiredContainerColors:
        try:
            sample.actualContainerColor = ContainerTopColor(sample.requiredContainerColors[0])
        except (ValueError, TypeError):
            sample.actualContainerColor = ContainerTopColor.PURPLE
    else:
        sample.actualContainerColor = ContainerTopColor.PURPLE
    sample.updatedBy = str(user_id)

    order_tests = db.query(OrderTest).filter(
        OrderTest.orderId == order_id,
        OrderTest.testCode.in_(test_codes),
        OrderTest.status.notin_([TestStatus.SUPERSEDED, TestStatus.REMOVED]),
    ).all()
    for ot in order_tests:
        # Only transition PENDING -> SAMPLE_COLLECTED; do not overwrite VALIDATED/ESCALATED/etc. (DB trigger)
        if ot.status == TestStatus.PENDING:
            ot.sampleId = sample.sampleId
            ot.status = TestStatus.SAMPLE_COLLECTED

    after = {
        "sampleId": sample.sampleId,
        "status": sample.status.value,
        "collectedAt": sample.collectedAt.isoformat() if sample.collectedAt else None,
    }
    log = LabOperationLog(
        operationType=LabOperationType.SAMPLE_COLLECT,
        entityType="sample",
        entityId=sample.sampleId,
        performedBy=str(user_id),
        performedAt=performed_at,
        beforeState=before,
        afterState=after,
        operationData={"testCodes": test_codes},
        comment=None,
    )
    db.add(log)


def _log_result_entry(
    db: Session,
    order_id: int,
    test_code: str,
    order_test_id: int,
    user_id: int,
    results: Dict[str, Any],
    performed_at: datetime,
) -> None:
    log = LabOperationLog(
        operationType=LabOperationType.RESULT_ENTRY,
        entityType="test",
        entityId=order_test_id,
        performedBy=str(user_id),
        performedAt=performed_at,
        beforeState={"status": "sample-collected"},
        afterState={"status": "resulted", "results": results},
        operationData={"orderId": order_id, "testCode": test_code},
        comment=None,
    )
    db.add(log)


def _log_result_validation_approve(
    db: Session,
    order_id: int,
    test_code: str,
    order_test_id: int,
    user_id: int,
    performed_at: datetime,
    validation_notes: Optional[str] = None,
) -> None:
    log = LabOperationLog(
        operationType=LabOperationType.RESULT_VALIDATION_APPROVE,
        entityType="test",
        entityId=order_test_id,
        performedBy=str(user_id),
        performedAt=performed_at,
        beforeState={"status": "resulted"},
        afterState={"status": "validated"},
        operationData={"orderId": order_id, "testCode": test_code, "validationNotes": validation_notes},
        comment=validation_notes,
    )
    db.add(log)


def _log_result_validation_reject_retest(
    db: Session,
    order_id: int,
    test_code: str,
    original_test_id: int,
    new_test_id: int,
    user_id: int,
    rejection_reason: str,
    retest_number: int,
    performed_at: datetime,
) -> None:
    log = LabOperationLog(
        operationType=LabOperationType.RESULT_VALIDATION_REJECT_RETEST,
        entityType="test",
        entityId=original_test_id,
        performedBy=str(user_id),
        performedAt=performed_at,
        beforeState={"status": "resulted", "testId": original_test_id},
        afterState={"status": "superseded", "retestOrderTestId": new_test_id},
        operationData={
            "orderId": order_id,
            "testCode": test_code,
            "originalTestId": original_test_id,
            "newTestId": new_test_id,
            "rejectionReason": rejection_reason,
            "retestNumber": retest_number,
            "sampleReused": True,
        },
        comment=rejection_reason,
    )
    db.add(log)


def _log_result_validation_escalate(
    db: Session,
    order_id: int,
    test_code: str,
    order_test_id: int,
    user_id: int,
    rejection_reason: str,
    performed_at: datetime,
) -> None:
    log = LabOperationLog(
        operationType=LabOperationType.RESULT_VALIDATION_ESCALATE,
        entityType="test",
        entityId=order_test_id,
        performedBy=str(user_id),
        performedAt=performed_at,
        beforeState={"status": "resulted"},
        afterState={"status": "escalated"},
        operationData={"orderId": order_id, "testCode": test_code, "rejectionReason": rejection_reason},
        comment=rejection_reason,
    )
    db.add(log)


def _update_order_status_local(db: Session, order_id: int) -> None:
    """Update order.overall_status from test states without committing (so seed stays in one transaction)."""
    order = db.query(Order).filter(Order.orderId == order_id).first()
    if not order or order.overallStatus in (OrderStatus.COMPLETED, OrderStatus.CANCELLED):
        return
    active = [t for t in order.tests if t.status not in (TestStatus.SUPERSEDED, TestStatus.REMOVED)]
    if not active:
        return
    if all(t.status == TestStatus.VALIDATED for t in active):
        order.overallStatus = OrderStatus.COMPLETED
    elif any(t.status in (
        TestStatus.SAMPLE_COLLECTED, TestStatus.IN_PROGRESS, TestStatus.RESULTED,
        TestStatus.VALIDATED, TestStatus.REJECTED, TestStatus.ESCALATED,
    ) for t in active):
        order.overallStatus = OrderStatus.IN_PROGRESS
    else:
        order.overallStatus = OrderStatus.ORDERED


def apply_scenario_to_order_test(
    db: Session,
    order: Order,
    order_test: OrderTest,
    scenario: str,
    event_chain: List[Tuple[str, datetime]],
    user_ids: Dict[str, int],
    result_items_by_test: Dict[str, List[Dict[str, Any]]],
    sample_by_order_and_codes: Dict[Tuple[int, Tuple[str, ...]], Sample],
    rng: Optional[random.Random] = None,
) -> None:
    """
    Apply scenario: update Sample/OrderTest, create retest rows for correction/escalation,
    insert LabOperationLog rows with explicit performedAt.
    """
    r = rng or random
    labtech = user_ids.get("labtech", 1)
    labtech_plus = user_ids.get("labtech_plus", 1)
    order_id = order.orderId
    test_code = order_test.testCode
    result_items = result_items_by_test.get(test_code, [])

    # Find sample for this order + test (samples are per sample type; one sample can cover multiple tests)
    sample = None
    for (oid, codes_tuple), s in sample_by_order_and_codes.items():
        if oid == order_id and test_code in codes_tuple:
            sample = s
            break
    if not sample and scenario != "pending_collection":
        return

    event_index = 0
    current_ot = order_test
    rejection_reason = "Seeder: out of range / repeat required"

    for event_type, performed_at in event_chain:
        if event_type == "sample_collect" and sample:
            _ensure_sample_collected(
                db, sample, order_id, list(sample.testCodes), performed_at, labtech
            )
            event_index += 1
            continue

        if event_type == "result_entry":
            results = generate_result_values(result_items, r)
            current_ot.results = results
            current_ot.resultEnteredAt = performed_at
            current_ot.enteredBy = str(labtech)
            current_ot.status = TestStatus.RESULTED
            _log_result_entry(db, order_id, test_code, current_ot.id, labtech, results, performed_at)
            event_index += 1
            continue

        if event_type == "result_validation_approve":
            current_ot.resultValidatedAt = performed_at
            current_ot.validatedBy = str(labtech_plus)
            current_ot.validationNotes = "Seeder: approved"
            current_ot.status = TestStatus.VALIDATED
            _log_result_validation_approve(db, order_id, test_code, current_ot.id, labtech_plus, performed_at)
            event_index += 1
            continue

        if event_type == "result_validation_reject_retest":
            # Append rejection record to current_ot; create new OrderTest (retest); supersede current_ot
            rec = {
                "rejectedAt": performed_at.isoformat(),
                "rejectedBy": str(labtech_plus),
                "rejectionReason": rejection_reason,
                "rejectionType": "re-test",
            }
            if current_ot.resultRejectionHistory is None:
                current_ot.resultRejectionHistory = []
            current_ot.resultRejectionHistory.append(rec)
            flag_modified(current_ot, "resultRejectionHistory")
            current_ot.resultValidatedAt = performed_at
            current_ot.validatedBy = str(labtech_plus)
            current_ot.validationNotes = rejection_reason

            retest_number = (current_ot.retestNumber or 0) + 1
            new_ot = OrderTest(
                orderId=order_id,
                testCode=test_code,
                status=TestStatus.SAMPLE_COLLECTED,
                priceAtOrder=current_ot.priceAtOrder,
                sampleId=current_ot.sampleId,
                isRetest=True,
                retestOfTestId=current_ot.id,
                retestNumber=retest_number,
                resultRejectionHistory=current_ot.resultRejectionHistory,
                technicianNotes=f"Re-test #{retest_number}: {rejection_reason}",
                flags=current_ot.flags,
                isReflexTest=current_ot.isReflexTest,
                triggeredBy=current_ot.triggeredBy,
                reflexRule=current_ot.reflexRule,
            )
            db.add(new_ot)
            db.flush()
            current_ot.retestOrderTestId = new_ot.id
            current_ot.status = TestStatus.SUPERSEDED
            _log_result_validation_reject_retest(
                db, order_id, test_code, current_ot.id, new_ot.id, labtech_plus,
                rejection_reason, retest_number, performed_at,
            )
            current_ot = new_ot
            event_index += 1
            continue

        if event_type == "result_validation_escalate":
            rec = {
                "rejectedAt": performed_at.isoformat(),
                "rejectedBy": str(labtech_plus),
                "rejectionReason": rejection_reason,
                "rejectionType": "escalate",
            }
            if current_ot.resultRejectionHistory is None:
                current_ot.resultRejectionHistory = []
            current_ot.resultRejectionHistory.append(rec)
            flag_modified(current_ot, "resultRejectionHistory")
            current_ot.status = TestStatus.ESCALATED
            _log_result_validation_escalate(db, order_id, test_code, current_ot.id, labtech_plus, rejection_reason, performed_at)
            event_index += 1
            continue

    db.flush()


def seed_lis_6months(
    db: Session,
    *,
    dry_run: bool = False,
    seed: Optional[int] = None,
    commit: bool = True,
) -> None:
    """
    Seed 6-month LIS history (50 patients, orders, workflows). Call from init_db or CLI.
    When commit=False, caller is responsible for commit/rollback.
    """
    if seed is not None:
        random.seed(seed)

    user_ids = get_user_ids_by_role(db)
    if not user_ids:
        raise RuntimeError("No users found. Run generate_users first.")
    result_items_by_test = load_result_items_by_test(db)
    if not result_items_by_test:
        raise RuntimeError("No tests found. Run generate_tests first.")

    print("Generating 50 patients (registration in [T-6M, T])...")
    patients = generate_patients_6m(db, NUM_PATIENTS)
    print(f"  Created {len(patients)} patients.")

    print("Generating orders and samples...")
    orders = generate_orders_6m(db, patients, user_ids)
    print(f"  Created {len(orders)} orders.")

    # Build (order_id, tuple of test_codes) -> Sample for quick lookup
    sample_by_order_and_codes: Dict[Tuple[int, Tuple[str, ...]], Sample] = {}
    for order in orders:
        samples = db.query(Sample).filter(Sample.orderId == order.orderId).all()
        for s in samples:
            key = (order.orderId, tuple(s.testCodes or []))
            sample_by_order_and_codes[key] = s

    # Assign scenario and apply to each PENDING order_test (skip superseded/removed)
    scenario_counts: Dict[str, int] = {}
    log_count_before = db.query(LabOperationLog).count()
    for order in orders:
        order_tests = db.query(OrderTest).filter(
            OrderTest.orderId == order.orderId,
            OrderTest.status == TestStatus.PENDING,
        ).all()
        order_date = order.orderDate
        if order_date.tzinfo is None:
            order_date = order_date.replace(tzinfo=timezone.utc)
        for ot in order_tests:
            scenario = assign_scenario()
            scenario_counts[scenario] = scenario_counts.get(scenario, 0) + 1
            event_chain = build_event_chain(scenario, order_date)
            apply_scenario_to_order_test(
                db, order, ot, scenario, event_chain,
                user_ids, result_items_by_test, sample_by_order_and_codes,
            )
        _update_order_status_local(db, order.orderId)

    log_count_after = db.query(LabOperationLog).count()
    total_order_tests = sum(scenario_counts.values())
    total_samples = db.query(Sample).filter(Sample.orderId.in_([o.orderId for o in orders])).count()
    print(f"\nOrder tests with scenario: {total_order_tests}; Samples (order set): {total_samples}")
    print("Scenario distribution:")
    for name, c in sorted(scenario_counts.items()):
        print(f"  {name}: {c}")
    print(f"Lab operation logs created: {log_count_after - log_count_before}")

    if commit:
        if dry_run:
            db.rollback()
            print("\n[DRY RUN] Rolled back.")
        else:
            db.commit()
            print("\nCommitted.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed LIS 6-month history (50 patients, orders, workflows).")
    parser.add_argument("--dry-run", action="store_true", help="Do not commit; rollback at end.")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducibility.")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        seed_lis_6months(db, dry_run=args.dry_run, seed=args.seed, commit=True)
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
