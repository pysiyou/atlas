"""Billing API — invoices and insurance claims."""

from app.domains.billing.schemas import (
    InsuranceClaimCreate,
    InsuranceClaimResponse,
    InvoiceResponse,
    InvoiceVoidRequest,
)
from app.domains.billing.service import BillingService
from app.domains.users.models import User
from app.platform.database import get_db
from app.platform.http.dependencies import get_current_user
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["billing"])


@router.get("/invoices/order/{orderId}", response_model=list[InvoiceResponse])
def list_invoices_for_order(
    orderId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BillingService(db).list_invoices_for_order(orderId)


@router.get("/invoices/{invoiceId}", response_model=InvoiceResponse)
def get_invoice(
    invoiceId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BillingService(db).get_invoice(invoiceId)


@router.post(
    "/invoices/order/{orderId}",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_invoice_for_order(
    orderId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = BillingService(db).create_invoice_for_order(orderId, current_user.id)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.post(
    "/invoices/{invoiceId}/void",
    response_model=InvoiceResponse,
    status_code=status.HTTP_200_OK,
)
def void_invoice(
    invoiceId: int,
    body: InvoiceVoidRequest | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reason = body.reason if body else None
    return BillingService(db).void_invoice(invoiceId, current_user.id, reason=reason)


@router.get("/insurance-claims/order/{orderId}", response_model=list[InsuranceClaimResponse])
def list_claims_for_order(
    orderId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BillingService(db).list_claims_for_order(orderId)


@router.post(
    "/insurance-claims", response_model=InsuranceClaimResponse, status_code=status.HTTP_201_CREATED
)
def submit_insurance_claim(
    body: InsuranceClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BillingService(db).submit_insurance_claim(body, current_user.id)
