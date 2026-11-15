"""SMTP delivery of issued lab-report PDFs."""
from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from app.platform.config import settings
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

BATCH_CAP = 50


def smtp_configured() -> bool:
    """True when SMTP_HOST is set so email endpoints can run."""
    return bool(settings.SMTP_HOST and settings.SMTP_FROM)


def assert_smtp_configured() -> None:
    if not smtp_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SMTP is not configured (set SMTP_HOST and SMTP_FROM)",
        )


def send_report_email(
    *,
    recipients: list[str],
    subject: str,
    body: str,
    pdf_bytes: bytes,
    filename: str,
) -> None:
    """Send one PDF attachment via SMTP. Raises HTTP 503/502 on config or transport errors."""
    assert_smtp_configured()
    cleaned = [addr.strip() for addr in recipients if addr and addr.strip()]
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No email recipients",
        )

    message = EmailMessage()
    message["From"] = settings.SMTP_FROM
    message["To"] = ", ".join(cleaned)
    message["Subject"] = subject
    message.set_content(body)
    message.add_attachment(
        pdf_bytes,
        maintype="application",
        subtype="pdf",
        filename=filename,
    )

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as client:
            if settings.SMTP_STARTTLS:
                client.starttls()
            if settings.SMTP_USER:
                client.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            client.send_message(message)
    except OSError as exc:
        logger.exception("SMTP send failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to send email: {exc}",
        ) from exc
