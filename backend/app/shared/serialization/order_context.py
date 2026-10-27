"""Shared mappers for patient/order snippets on list responses."""

from app.shared.contracts.enums import Gender
from app.shared.schemas.list_context import OrderListHeader, PatientListSnippet


def patient_list_snippet(
    *,
    patient_id: int,
    patient_name: str,
    patient_dob: str | None = None,
    patient_gender: Gender | None = None,
    patient_email: str | None = None,
    patient_phone: str | None = None,
) -> PatientListSnippet:
    return PatientListSnippet(
        patientId=patient_id,
        patientName=patient_name,
        patientDob=patient_dob,
        patientGender=patient_gender,
        patientEmail=patient_email,
        patientPhone=patient_phone,
    )


def patient_snippet_dict(snippet: PatientListSnippet) -> dict:
    """Flatten snippet onto a parent row dict (OpenAPI-compatible field names)."""
    return snippet.model_dump(exclude_none=True)


def order_list_header_fields(header: OrderListHeader) -> dict:
    return header.model_dump(exclude_none=True)
