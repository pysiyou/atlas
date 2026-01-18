"""
ID Generator Service
Generates IDs with pattern: PREFIX-YYYYMMDD-XXX
"""
from datetime import datetime
from typing import Dict
from sqlalchemy.orm import Session
from sqlalchemy import func

# ID prefix mapping
ID_PREFIXES = {
    "patient": "PAT",
    "order": "ORD",
    "sample": "SAM",
    "aliquot": "ALQ",
    "invoice": "INV",
    "payment": "PAY",
    "claim": "CLM",
    "report": "RPT",
    "user": "USR",
}


def generate_id(entity_type: str, db: Session) -> str:
    """
    Generate a unique ID for an entity
    Format: PREFIX-YYYYMMDD-XXX
    """
    prefix = ID_PREFIXES.get(entity_type)
    if not prefix:
        raise ValueError(f"Unknown entity type: {entity_type}")
    
    # Get current date
    today = datetime.now().strftime("%Y%m%d")
    
    # Get the appropriate model
    from app.models import (
        Patient, Order, Sample, Aliquot,
        Invoice, Payment, InsuranceClaim, Report, User
    )
    
    model_map = {
        "patient": (Patient, "id"),
        "order": (Order, "orderId"),
        "sample": (Sample, "sampleId"),
        "aliquot": (Aliquot, "aliquotId"),
        "invoice": (Invoice, "invoiceId"),
        "payment": (Payment, "paymentId"),
        "claim": (InsuranceClaim, "claimId"),
        "report": (Report, "reportId"),
        "user": (User, "id"),
    }
    
    model, id_field = model_map[entity_type]
    
    # Find the highest number for today
    pattern = f"{prefix}-{today}-%"
    existing = db.query(getattr(model, id_field)).filter(
        getattr(model, id_field).like(pattern)
    ).all()
    
    if not existing:
        counter = 1
    else:
        # Extract numbers and find max
        numbers = []
        for (id_value,) in existing:
            try:
                num = int(id_value.split("-")[-1])
                numbers.append(num)
            except (ValueError, IndexError):
                continue
        counter = max(numbers) + 1 if numbers else 1
    
    # Format: PREFIX-YYYYMMDD-XXX (zero-padded to 3 digits)
    return f"{prefix}-{today}-{counter:03d}"
