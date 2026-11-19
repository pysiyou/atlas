"""
Server-side lab worklists and command-center aggregates.

Replaces client-side filtering of full order/sample lists for lab queues.
"""

from datetime import UTC, date, datetime, time
from typing import Any

from app.domains.catalog.models import OrderableTest
from app.domains.lab.monitor.board import LabBoardService
from app.domains.lab.monitor.predicates import (
    inactive_lineage_filter,
    monitor_universe_predicate,
    running_tests_predicate,
)
from app.domains.lab.monitor.queries import collection_base_query, order_test_stage_query
from app.domains.lab.monitor.tat import CatalogTatResolver, age_bucket, hours_since
from app.domains.lab.quality.escalation import load_open_tickets_by_order_test_id
from app.domains.lab.specimen.volume import (
    classify_specimen_volume,
    effective_sample_volumes,
)
from app.domains.lab.results.display import (
    format_order_test_display,
    parse_order_test_display_search,
)
from app.domains.lab.specimen.models import Sample
from app.domains.lab.rules.blockers import priority_rank, priority_sort_key
from app.domains.lab.rules.projection import (
    LabWorkItemContext,
    project_collection_sample,
    project_order_test_entry,
    project_order_test_pipeline,
    project_order_test_validation,
    projection_to_worklist_fields,
)
from app.domains.lab.rules.status_sets import COLLECTION_WORKLIST_LINKED_EXCLUDE
from app.domains.lab.specimen.lookup import linked_order_tests_by_sample_ids
from app.domains.lab.specimen.models import Sample
from app.domains.orders.models import Order, OrderTest
from app.domains.patients.models import Patient
from app.domains.referent_doctors.service import referent_doctor_projection
from app.platform.cache import CacheKeys, cache_get, cache_set
from app.shared.generated.enums import PriorityLevel, SampleStatus, TestStatus
from app.shared.clinical import (
    compact_identifier,
    looks_like_accession,
    looks_like_filler,
    looks_like_mnemonic,
    looks_like_patient_id,
)
from sqlalchemy import and_, case, desc, exists, func, or_
from sqlalchemy.orm import Session

COLLECTION_SAMPLE_LOOKUP_MIN_LEN = 3
ROUTINE_PRIORITIES = (PriorityLevel.LOW, PriorityLevel.MEDIUM, PriorityLevel.HIGH)


def resolve_worklist_priorities(
    *,
    priorities: list[PriorityLevel] | None,
    priority_group: str | None,
) -> list[PriorityLevel] | None:
    """Intersect explicit priorities with STAT/Routine aliases (urgent vs the rest)."""
    selected = list(priorities or [])
    group: tuple[PriorityLevel, ...] | None = None
    if priority_group == "stat":
        group = (PriorityLevel.URGENT,)
    elif priority_group == "routine":
        group = ROUTINE_PRIORITIES
    if selected and group:
        filtered = [item for item in selected if item in group]
        return filtered
    if selected:
        return selected
    if group:
        return list(group)
    return None


def _apply_worklist_window_filters(
    query,
    *,
    order_date_col,
    sample_type_col,
    date_from: date | None,
    date_to: date | None,
    sample_types: list[str] | None,
):
    """Restrict a worklist query by order date window and sample types."""
    if date_from:
        start = datetime.combine(date_from, time.min, tzinfo=UTC)
        query = query.filter(order_date_col >= start)
    if date_to:
        end = datetime.combine(date_to, time.max, tzinfo=UTC)
        query = query.filter(order_date_col <= end)
    if sample_types:
        query = query.filter(sample_type_col.in_(sample_types))
    return query


def _collection_search_filter(search_term: str):
    term = search_term.strip()
    parsed = parse_order_test_display_search(term)
    if parsed:
        accession, test_code = parsed
        return and_(
            Sample.sampleId == accession,
            exists().where(
                and_(
                    OrderTest.sampleId == Sample.sampleId,
                    OrderTest.testCode == test_code,
                )
            ),
        )
    predicates = [
        Patient.fullName.ilike(f"%{term}%"),
        Sample.sampleId.ilike(f"%{term}%"),
        Order.orderId.ilike(f"%{term}%"),
        Patient.id.ilike(f"%{term}%"),
    ]
    compact = compact_identifier(term)
    if looks_like_accession(term):
        predicates.append(Sample.sampleId == term.strip())
    if looks_like_filler(term):
        predicates.append(Order.orderId == compact)
    if looks_like_patient_id(term):
        predicates.append(Patient.id == compact)
    return or_(*predicates)


def _order_test_worklist_search_filter(search_term: str):
    """Match patient id, filler, accession, test mnemonic, order-test display, or names."""
    term = search_term.strip()
    parsed = parse_order_test_display_search(term)
    if parsed:
        accession, test_code = parsed
        return and_(
            Sample.sampleId == accession,
            OrderTest.testCode == test_code,
        )
    predicates = [
        Patient.fullName.ilike(f"%{term}%"),
        OrderableTest.name.ilike(f"%{term}%"),
        OrderTest.testCode.ilike(f"%{term}%"),
        Sample.sampleId.ilike(f"%{term}%"),
        Order.orderId.ilike(f"%{term}%"),
        Patient.id.ilike(f"%{term}%"),
    ]
    compact = compact_identifier(term)
    if looks_like_accession(term):
        predicates.append(Sample.sampleId == term.strip())
    if looks_like_filler(term):
        predicates.append(Order.orderId == compact)
    if looks_like_patient_id(term):
        predicates.append(Patient.id == compact)
    if looks_like_mnemonic(term):
        predicates.append(OrderTest.testCode == term.strip().upper())
    return or_(*predicates)


def _paginate(total: int, page: int, page_size: int) -> dict[str, Any]:
    total_pages = max(1, (total + page_size - 1) // page_size)
    page = max(1, min(page, total_pages))
    return {
        "page": page,
        "pageSize": page_size,
        "total": total,
        "totalPages": total_pages,
        "hasNext": page < total_pages,
        "hasPrev": page > 1,
    }


def _sample_volume_status(sample: Sample | None) -> str | None:
    if sample is None or sample.receivedVolumeMl is None:
        return None
    return classify_specimen_volume(
        float(sample.receivedVolumeMl),
        float(sample.requiredVolume or 0),
        float(sample.optimalVolume or 0),
    ).value


def _worklist_result(
    items: list[dict[str, Any]],
    total: int,
    page: int,
    page_size: int,
    *,
    rows_loaded: int,
) -> dict[str, Any]:
    return {
        "items": items,
        "pagination": _paginate(total, page, page_size),
        "rows_loaded": rows_loaded,
    }


class LabWorklistService:
    def __init__(self, db: Session):
        self.db = db
        self._tat = CatalogTatResolver(db)
        self._catalog_cache: dict[str, tuple[str | None, str | None]] = {}
        self._catalog_tests_cache: dict[str, OrderableTest] = {}

    def _max_tat_for_codes(self, codes: list[str]) -> int:
        return self._tat.max_hours_for_codes(codes)

    def _catalog_tests_by_codes(self, codes: list[str]) -> dict[str, OrderableTest]:
        unique = list(dict.fromkeys(c for c in codes if c))
        missing = [c for c in unique if c not in self._catalog_tests_cache]
        if missing:
            rows = self.db.query(OrderableTest).filter(OrderableTest.code.in_(missing)).all()
            for row in rows:
                self._catalog_tests_cache[row.code] = row
        return {c: self._catalog_tests_cache[c] for c in unique if c in self._catalog_tests_cache}

    def _catalog_meta(self, code: str | None) -> tuple[str | None, str | None]:
        if not code:
            return None, None
        if code in self._catalog_cache:
            return self._catalog_cache[code]
        row = (
            self.db.query(OrderableTest.name, OrderableTest.category)
            .filter(OrderableTest.code == code)
            .first()
        )
        meta = (row[0], row[1]) if row else (None, None)
        self._catalog_cache[code] = meta
        return meta

    def _collection_test_display(self, codes: list[str]) -> tuple[str, str | None]:
        names: list[str] = []
        category: str | None = None
        for code in codes:
            name, cat = self._catalog_meta(code)
            if name:
                names.append(name)
            elif code:
                names.append(code)
            if category is None:
                category = cat
        if names:
            return ", ".join(names), category
        return "Sample collection", category

    @staticmethod
    def _linked_tests_for_collection_row(
        sample: Sample,
        order: Order,
        linked_by_sample: dict[str, list[OrderTest]],
    ) -> list[OrderTest]:
        codes = sample.testCodes or []
        return [
            ot
            for ot in linked_by_sample.get(sample.sampleId, [])
            if ot.orderId == order.orderId and ot.testCode in codes
        ]

    def _original_sample(
        self, sample: Sample, parents: dict[str, Sample] | None = None
    ) -> Sample | None:
        if not sample.originalSampleId:
            return None
        if parents is not None:
            return parents.get(sample.originalSampleId)
        return self.db.query(Sample).filter(Sample.sampleId == sample.originalSampleId).first()

    def _original_sample_collected_at(
        self, sample: Sample, parents: dict[str, Sample] | None = None
    ) -> datetime | None:
        parent = self._original_sample(sample, parents)
        return parent.collectedAt if parent else None

    def _samples_by_ids(self, sample_ids: list[str]) -> dict[str, Sample]:
        """Load samples keyed by primary key; empty input returns an empty map."""
        ids = [sample_id for sample_id in sample_ids if sample_id]
        if not ids:
            return {}
        return {
            row.sampleId: row
            for row in self.db.query(Sample).filter(Sample.sampleId.in_(ids)).all()
        }

    def _sample_lineage_fields(
        self, sample: Sample | None, parents: dict[str, Sample]
    ) -> dict[str, Any]:
        """Clinical recollection fields for order-test worklist rows."""
        if not sample:
            return {
                "sampleIsRecollection": False,
                "sampleOriginalSampleId": None,
                "sampleRecollectionAttempt": None,
            }
        return {
            "sampleIsRecollection": bool(sample.isRecollection),
            "sampleOriginalSampleId": sample.originalSampleId,
            "sampleRecollectionAttempt": sample.recollectionAttempt,
        }

    def _prior_test_display_map(self, order_tests: list[OrderTest]) -> dict[int, str]:
        """
        Map retest order-test ids to the prior line's accession/mnemonic display.

        Integer FKs stay internal; UI lineage uses the stored clinical identifiers.
        """
        prior_ids = {ot.retestOfTestId for ot in order_tests if ot.retestOfTestId}
        if not prior_ids:
            return {}
        priors = (
            self.db.query(OrderTest).filter(OrderTest.id.in_(prior_ids)).all()
        )
        prior_by_id = {row.id: row for row in priors}
        samples = self._samples_by_ids(
            [row.sampleId for row in priors if row.sampleId]
        )
        displays: dict[int, str] = {}
        for ot in order_tests:
            if not ot.retestOfTestId:
                continue
            prior = prior_by_id.get(ot.retestOfTestId)
            if not prior:
                continue
            prior_sample = samples.get(prior.sampleId) if prior.sampleId else None
            display = format_order_test_display(
                prior_sample.sampleId if prior_sample else None,
                prior.testCode,
            )
            if display and display != "-":
                displays[ot.id] = display
        return displays

    def _build_collection_worklist_item(
        self,
        *,
        sample: Sample,
        order: Order,
        patient: Patient,
        linked_tests: list[OrderTest],
        parents: dict[str, Sample] | None = None,
        include_queue_metrics: bool = True,
        catalog_by_code: dict[str, OrderableTest] | None = None,
    ) -> dict[str, Any]:
        codes = sample.testCodes or []
        catalog_tests = [
            catalog_by_code[c] for c in codes if catalog_by_code and c in catalog_by_code
        ]
        required_volume, optimal_volume = effective_sample_volumes(sample, catalog_tests)
        projection = project_collection_sample(
            LabWorkItemContext(
                order=order,
                sample=sample,
                linked_order_tests=linked_tests,
            )
        )
        work_item_fields = projection_to_worklist_fields(projection)
        test_name, test_category = self._collection_test_display(codes)
        since = order.orderDate
        hours = hours_since(since)
        tat = self._max_tat_for_codes(codes)
        item: dict[str, Any] = {
            "sampleId": sample.sampleId,
            "orderId": order.orderId,
            "patientId": patient.id,
            "patientName": patient.fullName,
            "sampleType": sample.sampleType.value if sample.sampleType else "",
            "status": sample.status,
            "priority": sample.priority,
            "paymentStatus": order.paymentStatus,
            "orderDate": order.orderDate,
            "testCodes": codes,
            **referent_doctor_projection(order),
            "testName": test_name,
            "testCategory": test_category,
            "isAliquot": bool(sample.isAliquot),
            "parentSampleId": sample.parentSampleId,
            "isRecollection": bool(sample.isRecollection),
            "originalSampleId": sample.originalSampleId,
            "originalSampleCollectedAt": self._original_sample_collected_at(sample, parents),
            "recollectionSampleId": sample.recollectionSampleId,
            "recollectionReason": sample.recollectionReason,
            "recollectionAttempt": sample.recollectionAttempt or 1,
            **work_item_fields,
            "waitingHours": round(hours, 2),
            "turnaroundHours": tat,
            "actualContainerType": sample.actualContainerType,
            "actualContainerColor": sample.actualContainerColor,
            "collectedAt": sample.collectedAt,
            "collectedBy": sample.collectedBy,
            "collectedVolume": sample.collectedVolume,
            "requiredVolume": required_volume,
            "optimalVolume": optimal_volume,
            "volumeStatus": _sample_volume_status(sample),
            "requiredContainerTypes": list(sample.requiredContainerTypes or []),
            "requiredContainerColors": list(sample.requiredContainerColors or []),
        }
        if include_queue_metrics:
            item["queueAgeBand"] = age_bucket(hours, tat)
            item["priorityRank"] = priority_rank(sample.priority)
        return item

    def _escalation_code(self, tickets_by_test: dict, order_test_id: int) -> str | None:
        ticket = tickets_by_test.get(order_test_id)
        if not ticket or not ticket.reasonCode:
            return None
        return ticket.reasonCode.value

    def _build_pipeline_dashboard_item(
        self,
        *,
        order_test: OrderTest,
        order: Order,
        patient: Patient,
        test: OrderableTest,
        sample: Sample | None,
        escalation_code: str | None,
    ) -> dict[str, Any]:
        updated_at = self._normalize_ts(order_test.updatedAt) or datetime.now(UTC)
        projection = project_order_test_pipeline(
            LabWorkItemContext(
                order=order,
                order_test=order_test,
                sample=sample,
                escalation_reason_code=escalation_code,
            )
        )
        work_item_fields = projection_to_worklist_fields(projection)
        return {
            "orderTestId": order_test.id,
            "orderId": order.orderId,
            "patientId": patient.id,
            "patientName": patient.fullName,
            "patientDob": patient.dateOfBirth,
            "patientGender": patient.gender,
            "testCode": order_test.testCode,
            "testName": test.name,
            "sampleType": test.sampleType or "",
            "priority": order.priority,
            "status": order_test.status,
            "stage": self._dashboard_stage(order_test),
            "activityAt": updated_at,
            "orderDate": order.orderDate,
            **referent_doctor_projection(order),
            "testCategory": test.category,
            **work_item_fields,
        }

    def _order_test_worklist_query(
        self,
        *,
        extra_filters: tuple,
        priorities: list[PriorityLevel] | None,
        date_from: date | None,
        date_to: date | None,
        sample_types: list[str] | None,
        search: str | None,
        category: str | None = None,
    ):
        query = order_test_stage_query(self.db).filter(*extra_filters)
        if priorities:
            query = query.filter(Order.priority.in_(priorities))
        if category:
            query = query.filter(OrderableTest.category == category)
        query = _apply_worklist_window_filters(
            query,
            order_date_col=Order.orderDate,
            sample_type_col=OrderableTest.sampleType,
            date_from=date_from,
            date_to=date_to,
            sample_types=sample_types,
        )
        search_term = search.strip() if search else ""
        if search_term:
            query = query.filter(_order_test_worklist_search_filter(search_term))
        return query, search_term

    def list_collection(
        self,
        *,
        page: int = 1,
        page_size: int = 50,
        search: str | None = None,
        priorities: list[PriorityLevel] | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        sample_types: list[str] | None = None,
        category: str | None = None,
    ) -> dict[str, Any]:
        search_term = search.strip() if search else ""
        if len(search_term) < COLLECTION_SAMPLE_LOOKUP_MIN_LEN:
            search_term = ""
        query = collection_base_query(self.db)
        if search_term:
            query = query.filter(_collection_search_filter(search_term))
        else:
            query = query.filter(Sample.status == SampleStatus.PENDING)
        if priorities:
            query = query.filter(Sample.priority.in_(priorities))
        if category:
            query = query.filter(
                exists().where(
                    and_(
                        OrderTest.sampleId == Sample.sampleId,
                        OrderTest.testCode == OrderableTest.code,
                        OrderableTest.category == category,
                    )
                )
            )
        query = _apply_worklist_window_filters(
            query,
            order_date_col=Order.orderDate,
            sample_type_col=Sample.sampleType,
            date_from=date_from,
            date_to=date_to,
            sample_types=sample_types,
        )
        total = query.count()
        start = (page - 1) * page_size
        if search_term:
            query = query.order_by(
                desc(Sample.updatedAt),
                desc(Sample.collectedAt),
                desc(Order.orderDate),
            )
        else:
            query = query.order_by(
                priority_sort_key(Sample.priority),
                Order.orderDate.asc(),
            )
        rows = query.offset(start).limit(page_size).all()
        parent_ids = [
            sample.originalSampleId for sample, _order, _patient in rows if sample.originalSampleId
        ]
        parents = self._samples_by_ids(parent_ids)
        all_codes: list[str] = []
        for sample, _order, _patient in rows:
            all_codes.extend(sample.testCodes or [])
        if all_codes:
            self._tat.warmup(all_codes)
        catalog_by_code = self._catalog_tests_by_codes(all_codes)
        sample_ids = [sample.sampleId for sample, _order, _patient in rows]
        linked_by_sample = linked_order_tests_by_sample_ids(
            self.db,
            sample_ids,
            exclude_statuses=COLLECTION_WORKLIST_LINKED_EXCLUDE,
        )
        items = []
        for sample, order, patient in rows:
            linked_tests = self._linked_tests_for_collection_row(sample, order, linked_by_sample)
            items.append(
                self._build_collection_worklist_item(
                    sample=sample,
                    order=order,
                    patient=patient,
                    linked_tests=linked_tests,
                    parents=parents,
                    catalog_by_code=catalog_by_code,
                )
            )
        return _worklist_result(items, total, page, page_size, rows_loaded=len(rows))

    def get_sample_work_context(self, sample_id: str) -> dict[str, Any]:
        """Canonical collection eligibility for one sample (deep-link / modal)."""
        from fastapi import HTTPException
        from fastapi import status as http_status

        row = collection_base_query(self.db).filter(Sample.sampleId == sample_id).first()
        if not row:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f"Sample {sample_id} not found",
            )
        sample, order, patient = row
        if sample.testCodes:
            self._tat.warmup(sample.testCodes)
        linked_by_sample = linked_order_tests_by_sample_ids(
            self.db,
            [sample.sampleId],
            exclude_statuses=COLLECTION_WORKLIST_LINKED_EXCLUDE,
        )
        linked_tests = self._linked_tests_for_collection_row(sample, order, linked_by_sample)
        catalog_by_code = self._catalog_tests_by_codes(sample.testCodes or [])
        return self._build_collection_worklist_item(
            sample=sample,
            order=order,
            patient=patient,
            linked_tests=linked_tests,
            include_queue_metrics=False,
            catalog_by_code=catalog_by_code,
        )

    def _order_test_in_active_worklist(self, order_test: OrderTest, sample: Sample | None) -> bool:
        """True when the test already appears on collection, entry, or validation worklists."""
        if order_test.status == TestStatus.SAMPLE_COLLECTED:
            return True
        if order_test.status == TestStatus.RESULTED and order_test.resultValidatedAt is None:
            return True
        return (
            order_test.status == TestStatus.PENDING
            and sample is not None
            and sample.status == SampleStatus.PENDING
        )

    def _pipeline_stage_for_test(self, order_test: OrderTest) -> str:
        if order_test.status == TestStatus.PENDING:
            return "collection"
        if order_test.status == TestStatus.SAMPLE_COLLECTED:
            return "entry"
        return "validation"

    def list_entry(
        self,
        *,
        page: int = 1,
        page_size: int = 50,
        search: str | None = None,
        priorities: list[PriorityLevel] | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        sample_types: list[str] | None = None,
        category: str | None = None,
    ) -> dict[str, Any]:
        query, _search_term = self._order_test_worklist_query(
            extra_filters=(OrderTest.status == TestStatus.SAMPLE_COLLECTED,),
            priorities=priorities,
            date_from=date_from,
            date_to=date_to,
            sample_types=sample_types,
            search=search,
            category=category,
        )
        total = query.count()
        start = (page - 1) * page_size
        since_col = func.coalesce(Sample.collectedAt, Order.orderDate)
        rows = (
            query.order_by(priority_sort_key(Order.priority), since_col.asc())
            .offset(start)
            .limit(page_size)
            .all()
        )
        items = []
        samples_in_page = [sample for _ot, _order, _patient, _test, sample in rows if sample]
        parents = self._samples_by_ids(
            [sample.originalSampleId for sample in samples_in_page if sample.originalSampleId]
        )
        prior_displays = self._prior_test_display_map([ot for ot, *_rest in rows])
        entry_codes: list[str] = []
        for _ot, _order, _patient, _test, sample in rows:
            if sample and sample.testCodes:
                entry_codes.extend(sample.testCodes)
        entry_catalog = self._catalog_tests_by_codes(entry_codes)
        for ot, order, patient, test, sample in rows:
            since = sample.collectedAt if sample and sample.collectedAt else order.orderDate
            hours = hours_since(since)
            projection = project_order_test_entry(
                LabWorkItemContext(order=order, order_test=ot, sample=sample)
            )
            work_item_fields = projection_to_worklist_fields(projection)
            if sample:
                sample_required, sample_optimal = effective_sample_volumes(
                    sample,
                    [entry_catalog[c] for c in (sample.testCodes or []) if c in entry_catalog],
                )
            else:
                sample_required, sample_optimal = None, None
            items.append(
                {
                    "orderTestId": ot.id,
                    "orderId": order.orderId,
                    "patientId": patient.id,
                    "patientName": patient.fullName,
                    "testCode": ot.testCode,
                    "testName": test.name,
                    "sampleId": ot.sampleId,
                    "sampleType": test.sampleType or "",
                    "priority": order.priority,
                    "status": ot.status,
                    "collectedAt": sample.collectedAt if sample else None,
                    "orderDate": order.orderDate,
                    "waitingHours": round(hours, 2),
                    "turnaroundHours": test.turnaroundTimeHours,
                    "isRetest": bool(ot.isRetest),
                    "retestOfTestId": ot.retestOfTestId,
                    "retestNumber": ot.retestNumber or 0,
                    "priorTestDisplay": prior_displays.get(ot.id),
                    **self._sample_lineage_fields(sample, parents),
                    **referent_doctor_projection(order),
                    "testCategory": test.category,
                    "collectedVolume": sample.collectedVolume if sample else None,
                    "sampleRequiredVolume": sample_required,
                    "sampleOptimalVolume": sample_optimal,
                    "volumeStatus": _sample_volume_status(sample),
                    **work_item_fields,
                    "queueAgeBand": None,
                    "priorityRank": priority_rank(order.priority),
                }
            )
        return _worklist_result(items, total, page, page_size, rows_loaded=len(rows))

    def list_validation(
        self,
        *,
        page: int = 1,
        page_size: int = 50,
        search: str | None = None,
        priorities: list[PriorityLevel] | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        sample_types: list[str] | None = None,
        category: str | None = None,
    ) -> dict[str, Any]:
        query, _search_term = self._order_test_worklist_query(
            extra_filters=(
                OrderTest.status == TestStatus.RESULTED,
                OrderTest.resultValidatedAt.is_(None),
            ),
            priorities=priorities,
            date_from=date_from,
            date_to=date_to,
            sample_types=sample_types,
            search=search,
            category=category,
        )
        total = query.count()
        start = (page - 1) * page_size
        since_col = func.coalesce(OrderTest.resultEnteredAt, Order.orderDate)
        rows = (
            query.order_by(priority_sort_key(Order.priority), since_col.asc())
            .offset(start)
            .limit(page_size)
            .all()
        )
        items = []
        samples_in_page = [sample for _ot, _order, _patient, _test, sample in rows if sample]
        parents = self._samples_by_ids(
            [sample.originalSampleId for sample in samples_in_page if sample.originalSampleId]
        )
        prior_displays = self._prior_test_display_map([ot for ot, *_rest in rows])
        for ot, order, patient, test, sample in rows:
            since = ot.resultEnteredAt or order.orderDate
            hours = hours_since(since)
            tat_band = (
                age_bucket(hours, test.turnaroundTimeHours) if test.turnaroundTimeHours else None
            )
            projection = project_order_test_validation(
                LabWorkItemContext(order=order, order_test=ot, sample=sample)
            )
            work_item_fields = projection_to_worklist_fields(projection)
            items.append(
                {
                    "orderTestId": ot.id,
                    "orderId": order.orderId,
                    "patientId": patient.id,
                    "patientName": patient.fullName,
                    "testCode": ot.testCode,
                    "testName": test.name,
                    "sampleType": test.sampleType or "",
                    "sampleId": ot.sampleId,
                    "priority": order.priority,
                    "status": ot.status,
                    "resultEnteredAt": ot.resultEnteredAt,
                    "orderDate": order.orderDate,
                    "waitingHours": round(hours, 2),
                    "turnaroundHours": test.turnaroundTimeHours,
                    "hasCriticalValues": bool(ot.hasCriticalValues),
                    "testCategory": test.category,
                    "sampleStatus": sample.status if sample else None,
                    "results": ot.results,
                    "flags": ot.flags,
                    "enteredBy": ot.enteredBy,
                    **referent_doctor_projection(order),
                    "isRetest": bool(ot.isRetest),
                    "retestOfTestId": ot.retestOfTestId,
                    "retestNumber": ot.retestNumber or 0,
                    "priorTestDisplay": prior_displays.get(ot.id),
                    **self._sample_lineage_fields(sample, parents),
                    **work_item_fields,
                    "queueAgeBand": tat_band,
                    "priorityRank": priority_rank(order.priority),
                }
            )
        return _worklist_result(items, total, page, page_size, rows_loaded=len(rows))

    def _utc_today_start(self) -> datetime:
        today = datetime.now(UTC).date()
        return datetime.combine(today, datetime.min.time()).replace(tzinfo=UTC)

    def _dashboard_stage(self, order_test: OrderTest) -> str:
        if order_test.status in (TestStatus.VALIDATED, TestStatus.ESCALATED):
            return "validation"
        return self._pipeline_stage_for_test(order_test)

    def _normalize_ts(self, ts: datetime | None) -> datetime | None:
        if ts is None:
            return None
        if ts.tzinfo is None:
            return ts.replace(tzinfo=UTC)
        return ts

    @staticmethod
    def _dashboard_running_predicate():
        """Order tests still in the lab pipeline (non-terminal lifecycle)."""
        return running_tests_predicate()

    @staticmethod
    def _dashboard_monitor_rows_predicate(today_start: datetime):
        """Union of tests updated today (UTC) and tests still running in the pipeline."""
        return monitor_universe_predicate(today_start)

    def list_dashboard_work_today(
        self,
        *,
        user_id: str,
        page: int = 1,
        page_size: int = 50,
    ) -> dict[str, Any]:
        """Lab monitor table rows: union of tests updated today (UTC) and still-running pipeline tests."""
        _ = user_id  # reserved for future per-user scoping
        today_start = self._utc_today_start()
        running = self._dashboard_running_predicate()
        stale_running = and_(running, OrderTest.updatedAt < today_start)
        stale_running_rank = case((stale_running, 1), else_=0)

        base_query = order_test_stage_query(self.db).filter(
            self._dashboard_monitor_rows_predicate(today_start)
        )
        total = base_query.count()
        start = (page - 1) * page_size
        rows = (
            base_query.order_by(desc(stale_running_rank), OrderTest.updatedAt.desc())
            .offset(start)
            .limit(page_size)
            .all()
        )

        escalated_ids = [
            ot.id
            for ot, _order, _patient, _test, _sample in rows
            if ot.status == TestStatus.ESCALATED
        ]
        tickets_by_test = load_open_tickets_by_order_test_id(self.db, escalated_ids)

        items: list[dict[str, Any]] = []
        for order_test, order, patient, test, sample in rows:
            updated_at = self._normalize_ts(order_test.updatedAt) or datetime.now(UTC)
            item = self._build_pipeline_dashboard_item(
                order_test=order_test,
                order=order,
                patient=patient,
                test=test,
                sample=sample,
                escalation_code=self._escalation_code(tickets_by_test, order_test.id),
            )
            item["_sort_updated"] = updated_at
            items.append(item)

        for item in items:
            item.pop("_sort_updated", None)
        return _worklist_result(items, total, page, page_size, rows_loaded=len(rows))

    def list_all_order_tests(
        self,
        *,
        page: int = 1,
        page_size: int = 50,
        search: str | None = None,
        priorities: list[PriorityLevel] | None = None,
        statuses: list[TestStatus] | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        sample_types: list[str] | None = None,
    ) -> dict[str, Any]:
        """All order tests, newest activity first (OrderTest.updatedAt)."""
        query = order_test_stage_query(self.db).filter(inactive_lineage_filter())
        if priorities:
            query = query.filter(Order.priority.in_(priorities))
        if statuses:
            query = query.filter(OrderTest.status.in_(statuses))
        if date_from:
            start = datetime.combine(date_from, time.min, tzinfo=UTC)
            query = query.filter(OrderTest.updatedAt >= start)
        if date_to:
            end = datetime.combine(date_to, time.max, tzinfo=UTC)
            query = query.filter(OrderTest.updatedAt <= end)
        if sample_types:
            query = query.filter(OrderableTest.sampleType.in_(sample_types))
        search_term = search.strip() if search else ""
        if search_term:
            query = query.filter(_order_test_worklist_search_filter(search_term))

        total = query.count()
        start = (page - 1) * page_size
        rows = query.order_by(OrderTest.updatedAt.desc()).offset(start).limit(page_size).all()

        escalated_ids = [
            ot.id
            for ot, _order, _patient, _test, _sample in rows
            if ot.status == TestStatus.ESCALATED
        ]
        tickets_by_test = load_open_tickets_by_order_test_id(self.db, escalated_ids)

        items: list[dict[str, Any]] = []
        for order_test, order, patient, test, sample in rows:
            items.append(
                self._build_pipeline_dashboard_item(
                    order_test=order_test,
                    order=order,
                    patient=patient,
                    test=test,
                    sample=sample,
                    escalation_code=self._escalation_code(tickets_by_test, order_test.id),
                )
            )
        return _worklist_result(items, total, page, page_size, rows_loaded=len(rows))

    def get_board(
        self,
        include_supervisor: bool = True,
        *,
        detail: str = "full",
    ) -> dict[str, Any]:
        if detail == "summary":
            scope = "supervisor" if include_supervisor else "tech"
            cache_key = f"{CacheKeys.LAB_BOARD_SUMMARY_PREFIX}:{scope}"
            cached = cache_get(cache_key)
            if cached is not None:
                return cached
            board = LabBoardService(self.db)
            summary = board.compute_board_summary(include_supervisor=include_supervisor)
            cache_set(cache_key, summary, ttl=15)
            return summary
        board = LabBoardService(self.db)
        return board.compute_board_snapshot(
            include_supervisor=include_supervisor,
            detail="full",
        )

    @staticmethod
    def expand_summary_to_board_response(summary: dict[str, Any]) -> dict[str, Any]:
        """Pad summary counts with empty monitor sections for LabBoardResponse compatibility."""
        empty_age = {
            "oldestHours": None,
            "averageHours": None,
            "warningCount": 0,
            "criticalCount": 0,
        }
        return {
            **summary,
            "queueAge": {
                "collection": empty_age,
                "entry": empty_age,
                "validation": empty_age,
            },
            "blockers": {
                "paymentUnpaid": 0,
                "retestPending": 0,
                "recollectionWaiting": 0,
                "total": 0,
            },
            "ageBuckets": {"fresh": 0, "onTrack": 0, "warning": 0, "critical": 0},
            "priorityMix": {"urgent": 0, "high": 0, "medium": 0, "low": 0},
            "attentionItems": [],
            "attentionTotal": 0,
        }
