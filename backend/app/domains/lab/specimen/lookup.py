"""Shared specimen and linked test queries."""


from collections.abc import Iterable
from dataclasses import dataclass

from app.domains.lab.specimen.models import Sample
from app.domains.orders.models import OrderTest
from app.shared.errors import LabOperationError
from app.shared.generated.enums import SampleStatus, TestStatus
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

_TERMINAL_TEST_STATUSES = frozenset(
    {
        TestStatus.SUPERSEDED,
        TestStatus.REMOVED,
        TestStatus.CANCELLED,
        TestStatus.VALIDATED,
    }
)


def recollection_successor_chain(db: Session, sample: Sample) -> list[Sample]:
    """This tube followed by each later recollection accession.

    After a validation recollection the rejected barcode (e.g. 26-00014) stays on
    the original row; the enterable retest is on ``recollectionSampleId``.
    """
    chain: list[Sample] = [sample]
    seen = {sample.sampleId}
    current = sample
    while current.recollectionSampleId:
        nxt = db.query(Sample).filter(Sample.sampleId == current.recollectionSampleId).first()
        if not nxt or nxt.sampleId in seen:
            break
        chain.append(nxt)
        seen.add(nxt.sampleId)
        current = nxt
    return chain


def resolve_physical_sample(db: Session, sample: Sample) -> Sample:
    """Aliquot barcodes resolve to the parent tube that owns the order-test rows."""
    if not sample.isAliquot or not sample.parentSampleId:
        return sample
    parent = db.query(Sample).filter(Sample.sampleId == sample.parentSampleId).first()
    return parent or sample


def _tube_accepts_results(tube: Sample) -> bool:
    return tube.status == SampleStatus.COLLECTED and not tube.isAliquot


def find_enterable_order_test(
    db: Session,
    sample: Sample,
    test_code: str,
) -> OrderTest | None:
    """SAMPLE_COLLECTED order-test for ``test_code`` on a collected tube in this chain.

    Skips REJECTED / uncollected accessions so leftover rows on a dead barcode cannot win.
    Aliquot scans resolve to the parent first.
    """
    code = test_code.strip().upper()
    if not code:
        return None
    root = resolve_physical_sample(db, sample)
    collected: list[OrderTest] = []
    for tube in recollection_successor_chain(db, root):
        if not _tube_accepts_results(tube):
            continue
        order_test = (
            db.query(OrderTest)
            .filter(
                OrderTest.orderId == root.orderId,
                OrderTest.testCode == code,
                OrderTest.sampleId == tube.sampleId,
                OrderTest.status == TestStatus.SAMPLE_COLLECTED,
            )
            .order_by(OrderTest.id.desc())
            .first()
        )
        if order_test:
            collected.append(order_test)
    if not collected:
        return None
    return max(collected, key=lambda row: row.id)


def find_enterable_order_test_on_order(
    db: Session,
    order_id: str,
    test_code: str,
) -> OrderTest | None:
    """Newest SAMPLE_COLLECTED row for ``test_code`` on a currently collected tube."""
    code = test_code.strip().upper()
    if not code:
        return None
    rows = (
        db.query(OrderTest, Sample)
        .join(Sample, Sample.sampleId == OrderTest.sampleId)
        .filter(
            OrderTest.orderId == order_id,
            OrderTest.testCode == code,
            OrderTest.status == TestStatus.SAMPLE_COLLECTED,
            Sample.status == SampleStatus.COLLECTED,
            or_(Sample.isAliquot.is_(False), Sample.isAliquot.is_(None)),
        )
        .order_by(OrderTest.id.desc())
        .all()
    )
    return rows[0][0] if rows else None


def latest_order_test_on_sample_chain(
    db: Session,
    sample: Sample,
    test_code: str,
) -> OrderTest | None:
    """Newest order-test row for ``test_code`` on this accession or recollection successors."""
    code = test_code.strip().upper()
    if not code:
        return None
    root = resolve_physical_sample(db, sample)
    sample_ids = [tube.sampleId for tube in recollection_successor_chain(db, root)]
    return (
        db.query(OrderTest)
        .filter(
            OrderTest.orderId == root.orderId,
            OrderTest.testCode == code,
            OrderTest.sampleId.in_(sample_ids),
        )
        .order_by(OrderTest.id.desc())
        .first()
    )


@dataclass(frozen=True)
class LiveOrderTest:
    """Non-terminal order-test on the current tube in a recollection/retest chain."""

    sample: Sample
    order_test: OrderTest


def live_order_test_for(
    db: Session,
    sample: Sample,
    test_code: str,
) -> LiveOrderTest | None:
    """Walk recollection then retest successor until a non-terminal row on a live tube."""
    code = test_code.strip().upper()
    if not code:
        return None
    root = resolve_physical_sample(db, sample)
    enterable = find_enterable_order_test(db, root, code)
    if enterable and enterable.sampleId:
        tube = db.query(Sample).filter(Sample.sampleId == enterable.sampleId).first()
        if tube:
            return LiveOrderTest(sample=tube, order_test=enterable)

    for tube in reversed(recollection_successor_chain(db, root)):
        if tube.status not in {SampleStatus.PENDING, SampleStatus.COLLECTED}:
            continue
        row = (
            db.query(OrderTest)
            .filter(
                OrderTest.orderId == root.orderId,
                OrderTest.testCode == code,
                OrderTest.sampleId == tube.sampleId,
                OrderTest.status.notin_(tuple(_TERMINAL_TEST_STATUSES)),
            )
            .order_by(OrderTest.id.desc())
            .first()
        )
        if row:
            current = row
            seen: set[int] = set()
            while current.retestOrderTestId and current.id not in seen:
                seen.add(current.id)
                nxt = (
                    db.query(OrderTest).filter(OrderTest.id == current.retestOrderTestId).first()
                )
                if not nxt or nxt.status in _TERMINAL_TEST_STATUSES:
                    break
                current = nxt
            live_tube = tube
            if current.sampleId and current.sampleId != tube.sampleId:
                relocated = (
                    db.query(Sample).filter(Sample.sampleId == current.sampleId).first()
                )
                if relocated:
                    live_tube = relocated
            return LiveOrderTest(sample=live_tube, order_test=current)
    return None


def accession_lineage_match(accession: str):
    """SQL clause: this accession or a recollection whose original is ``accession``.

    MAX_RECOLLECTION_ATTEMPTS is 2 (original + one successor), so one-hop
    ``originalSampleId`` is sufficient for worklist search.
    """
    token = accession.strip()
    return or_(Sample.sampleId == token, Sample.originalSampleId == token)


def get_sample_or_error(
    db: Session,
    sample_id: str,
    *,
    for_update: bool = False,
) -> Sample:
    query = db.query(Sample).filter(Sample.sampleId == sample_id)
    if for_update:
        query = query.with_for_update()
    sample = query.first()
    if not sample:
        raise LabOperationError(f"Sample {sample_id} not found", status_code=404)
    return sample


def linked_order_tests_for_sample(
    db: Session,
    sample: Sample,
    *,
    exclude_statuses: Iterable[TestStatus] | None = None,
    include_unassigned: bool = False,
) -> list[OrderTest]:
    """Tests physically on this tube (``OrderTest.sampleId``).

    ``include_unassigned`` is only for initial generate_samples linking: PENDING rows
    with ``sampleId is None`` whose code is listed on the tube.
    """
    membership = OrderTest.sampleId == sample.sampleId
    if include_unassigned:
        codes = list(sample.testCodes or [])
        if codes:
            membership = or_(
                membership,
                and_(OrderTest.sampleId.is_(None), OrderTest.testCode.in_(codes)),
            )
    query = db.query(OrderTest).filter(
        OrderTest.orderId == sample.orderId,
        membership,
    )
    if exclude_statuses:
        query = query.filter(OrderTest.status.notin_(tuple(exclude_statuses)))
    return query.all()


def sync_sample_test_codes(sample: Sample, tests: Iterable[OrderTest]) -> None:
    """Keep ``sample.testCodes`` aligned with tests actually on the tube."""
    codes: list[str] = []
    seen: set[str] = set()
    for test in tests:
        if not test.testCode or test.testCode in seen:
            continue
        if test.status in {TestStatus.SUPERSEDED, TestStatus.REMOVED, TestStatus.CANCELLED}:
            continue
        seen.add(test.testCode)
        codes.append(test.testCode)
    sample.testCodes = codes


def linked_order_tests_by_sample_ids(
    db: Session,
    sample_ids: Iterable[str],
    *,
    exclude_statuses: Iterable[TestStatus] | None = None,
) -> dict[str, list[OrderTest]]:
    ids = list(sample_ids)
    grouped: dict[str, list[OrderTest]] = {sid: [] for sid in ids}
    if not ids:
        return grouped
    query = db.query(OrderTest).filter(OrderTest.sampleId.in_(ids))
    if exclude_statuses:
        query = query.filter(OrderTest.status.notin_(tuple(exclude_statuses)))
    for order_test in query.all():
        if order_test.sampleId is not None:
            grouped.setdefault(order_test.sampleId, []).append(order_test)
    return grouped
