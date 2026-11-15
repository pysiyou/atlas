"""Report data, PDF, and email API."""
from datetime import date

from app.domains.reports.email_service import BATCH_CAP, assert_smtp_configured
from app.domains.reports.schemas import ReportableOrderItem, ReportBatchRequest, ReportEmailRequest
from app.domains.reports.service import ReportService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import get_current_user
from app.shared.schemas.pagination import PaginatedResponse
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

router = APIRouter(tags=["reports"])


@router.get(
    "/reports/orders",
    response_model=PaginatedResponse[ReportableOrderItem],
    status_code=status.HTTP_200_OK,
)
def list_reportable_orders(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Page size"),
    search: str | None = Query(None, max_length=100),
    dateFrom: date | None = None,
    dateTo: date | None = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    return ReportService(db).list_reportable_orders(
        skip=skip,
        limit=limit,
        search=search,
        date_from=dateFrom,
        date_to=dateTo,
    )


@router.get(
    "/reports/orders/{orderId}",
    response_model=ReportableOrderItem,
    status_code=status.HTTP_200_OK,
)
def get_reportable_order(
    orderId: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    return ReportService(db).get_reportable_order_view(orderId)


@router.get(
    "/reports/orders/{orderId}/download",
    response_model=ReportableOrderItem,
    status_code=status.HTTP_200_OK,
)
def download_order_report(
    orderId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ReportService(db).get_reportable_order(orderId, current_user.id)


@router.get("/reports/orders/{orderId}/pdf")
def download_order_report_pdf(
    orderId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pdf_bytes, filename = ReportService(db).issue_pdf(orderId, current_user.id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/reports/orders/{orderId}/email")
def email_order_report(
    orderId: int,
    payload: ReportEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_smtp_configured()
    return ReportService(db).email_report(orderId, current_user.id, payload)


@router.post("/reports/batch/pdf")
def batch_download_pdfs(
    payload: ReportBatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return concatenated PDFs as a zip-like sequential payload of per-order files.

    Clients should prefer per-order GET /pdf; this endpoint archives each order
    and returns the last generated file when a single id is supplied, or a
    simple application/zip of all PDFs for multiple ids.
    """
    import io
    import zipfile

    if len(payload.orderIds) > BATCH_CAP:
        raise HTTPException(status_code=400, detail=f"Batch size exceeds {BATCH_CAP}")
    service = ReportService(db)
    if len(payload.orderIds) == 1:
        pdf_bytes, filename = service.issue_pdf(payload.orderIds[0], current_user.id)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        for order_id in payload.orderIds:
            pdf_bytes, filename = service.issue_pdf(order_id, current_user.id)
            archive.writestr(filename, pdf_bytes)
    return Response(
        content=buffer.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="lab-reports.zip"'},
    )


@router.post("/reports/batch/email")
def batch_email_reports(
    payload: ReportBatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_smtp_configured()
    if len(payload.orderIds) > BATCH_CAP:
        raise HTTPException(status_code=400, detail=f"Batch size exceeds {BATCH_CAP}")
    service = ReportService(db)
    results = []
    for order_id in payload.orderIds:
        results.append(
            service.email_report(
                order_id,
                current_user.id,
                ReportEmailRequest(includePatient=True, includePhysician=True),
            )
        )
    return {"sent": results}
