"""Server-side lab report PDF generation with reportlab."""
from __future__ import annotations

import hashlib
import logging
from datetime import UTC, datetime
from io import BytesIO
from pathlib import Path
from typing import Any

from app.domains.audit.search import format_record_display_id
from app.domains.orders.models import Order
from app.domains.reports.models import ReportDocument
from app.platform.client_config import client_config
from app.platform.config import settings
from app.shared.contracts.enums import TestStatus
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def _reports_dir() -> Path:
    path = Path(settings.REPORTS_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _logo_path() -> Path | None:
    branding = client_config.branding or {}
    raw = branding.get("logoPath") or ""
    if not raw:
        return None
    candidates = [
        Path(raw),
        Path("frontend/public") / raw.lstrip("/"),
        Path("config") / Path(raw).name,
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return None


class ReportPdfService:
    """Build, persist, and load issued order PDFs."""

    def __init__(self, db: Session):
        self.db = db

    def build_pdf_bytes(self, order: Order) -> bytes:
        """Render a lab report from the same fields the client preview uses."""
        reports_cfg = client_config.reports or {}
        header_text = reports_cfg.get("headerText") or client_config.company.get(
            "fullName", "Laboratory Report"
        )
        footer_text = reports_cfg.get("footerText") or ""
        include_signature = bool(reports_cfg.get("includeSignature", True))
        patient = order.patient
        doctor = order.referentDoctor

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=18 * mm,
            rightMargin=18 * mm,
            topMargin=16 * mm,
            bottomMargin=18 * mm,
            title=f"Lab report {order.orderId}",
        )
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Heading1"],
            fontSize=14,
            spaceAfter=8,
        )
        body = ParagraphStyle("ReportBody", parent=styles["Normal"], fontSize=9, leading=12)
        muted = ParagraphStyle("ReportMuted", parent=body, textColor=colors.HexColor("#4b5563"))

        story: list[Any] = []
        logo = _logo_path()
        if logo is not None:
            try:
                story.append(Image(str(logo), width=28 * mm, height=12 * mm, kind="proportional"))
                story.append(Spacer(1, 4 * mm))
            except Exception:
                logger.warning("Could not embed report logo from %s", logo)

        story.append(Paragraph(str(header_text), title_style))
        story.append(
            Paragraph(
                f"Order ORD{order.orderId:04d} · {order.orderDate.strftime('%Y-%m-%d %H:%M UTC')}",
                muted,
            )
        )
        story.append(Spacer(1, 4 * mm))

        patient_id_suffix = (
            f" ({format_record_display_id('PAT', patient.id)})" if patient else ""
        )
        patient_lines = [
            f"<b>Patient</b>: {patient.fullName if patient else 'Unknown'}{patient_id_suffix}",
            f"<b>DOB / Sex</b>: {getattr(patient, 'dateOfBirth', '—') if patient else '—'} / "
            f"{getattr(patient.gender, 'value', patient.gender) if patient and patient.gender else '—'}",
            f"<b>Phone</b>: {getattr(patient, 'phone', '—') if patient else '—'}",
        ]
        if doctor:
            patient_lines.append(
                f"<b>Referent physician</b>: {doctor.fullName}"
                + (f" · {doctor.hospital}" if doctor.hospital else "")
            )
        if order.clinicalNotes:
            patient_lines.append(f"<b>Clinical notes</b>: {order.clinicalNotes}")
        for line in patient_lines:
            story.append(Paragraph(line, body))
        story.append(Spacer(1, 5 * mm))

        header = ["Test", "Parameter", "Result", "Flag", "Reference"]
        rows: list[list[str]] = [header]
        for ot in order.tests or []:
            if ot.status in {TestStatus.SUPERSEDED, TestStatus.REMOVED}:
                continue
            results = ot.results if isinstance(ot.results, dict) else {}
            test_name = ot.testName or ot.testCode
            if not results:
                rows.append([test_name, "—", "—", "", ""])
                continue
            for code, raw in results.items():
                value, unit, ref, flag = _format_result_cell(raw)
                display = f"{value} {unit}".strip()
                rows.append([test_name, str(code), display, flag, ref])
                test_name = ""
            notes = []
            if ot.technicianNotes:
                notes.append(f"Tech: {ot.technicianNotes}")
            if ot.validationNotes:
                notes.append(f"Validation: {ot.validationNotes}")
            if notes:
                rows.append(["", "", "; ".join(notes), "", ""])

        table = Table(rows, colWidths=[38 * mm, 32 * mm, 38 * mm, 22 * mm, 40 * mm])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ]
            )
        )
        story.append(table)
        story.append(Spacer(1, 8 * mm))
        if include_signature:
            story.append(Paragraph("Validated electronically. Signature on file.", muted))
        if footer_text:
            story.append(Spacer(1, 6 * mm))
            story.append(Paragraph(str(footer_text), muted))

        doc.build(story)
        return buffer.getvalue()

    def persist_pdf(self, order: Order, pdf_bytes: bytes, user_id: int) -> ReportDocument:
        """Write bytes under REPORTS_DIR and upsert a report_documents row."""
        digest = hashlib.sha256(pdf_bytes).hexdigest()
        path = _reports_dir() / f"order-{order.orderId}.pdf"
        path.write_bytes(pdf_bytes)
        existing = (
            self.db.query(ReportDocument)
            .filter(ReportDocument.orderId == order.orderId)
            .order_by(ReportDocument.id.desc())
            .first()
        )
        if existing:
            existing.path = str(path)
            existing.sha256 = digest
            existing.createdBy = str(user_id)
            existing.createdAt = datetime.now(UTC)
            self.db.flush()
            return existing
        row = ReportDocument(
            orderId=order.orderId,
            path=str(path),
            sha256=digest,
            createdBy=str(user_id),
        )
        self.db.add(row)
        self.db.flush()
        return row

    def generate_and_store(self, order: Order, user_id: int) -> tuple[bytes, ReportDocument]:
        pdf_bytes = self.build_pdf_bytes(order)
        document = self.persist_pdf(order, pdf_bytes, user_id)
        return pdf_bytes, document


def _format_result_cell(raw: Any) -> tuple[str, str, str, str]:
    if isinstance(raw, dict):
        value = raw.get("value")
        unit = raw.get("unit") or ""
        ref = raw.get("referenceRange") or ""
        flag = raw.get("status") or raw.get("flag") or ""
        return ("" if value is None else str(value), str(unit), str(ref), str(flag))
    return ("" if raw is None else str(raw), "", "", "")
