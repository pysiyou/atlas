"""Billing API — invoices and insurance claims."""
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.billing import InsuranceClaimCreate, InsuranceClaimResponse, InvoiceResponse
from app.services.billing.invoice import BillingService

router = APIRouter(tags=["billing"])


@router.get("/invoices/order/{orderId}", response_model=List[InvoiceResponse])
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
    invoice = BillingService(db).create_invoice_for_order(orderId)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.get("/insurance-claims/order/{orderId}", response_model=List[InsuranceClaimResponse])
def list_claims_for_order(
    orderId: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BillingService(db).list_claims_for_order(orderId)


@router.post("/insurance-claims", response_model=InsuranceClaimResponse, status_code=status.HTTP_201_CREATED)
def submit_insurance_claim(
    body: InsuranceClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BillingService(db).submit_insurance_claim(body, current_user.id)
