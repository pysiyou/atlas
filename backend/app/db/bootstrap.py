"""Dev database bootstrap: drop/create tables and seed reference data. No migrations."""
from __future__ import annotations

import json
from pathlib import Path

from app.core.security import get_password_hash
from app.db.database import Base, SessionLocal, engine
from app.models import AffiliationPricing, Test, User
from app.schemas.enums import AffiliationDuration, UserRole
from app.utils.common import infer_criterion_domain

CATALOG_PATH = Path(__file__).resolve().parents[1] / "data" / "test-catalog.json"

SEED_USERS = [
    {
        "username": "admin",
        "password": "admin123",
        "name": "System Administrator",
        "role": UserRole.ADMIN,
        "email": "admin@atlas.local",
    },
    {
        "username": "receptionist",
        "password": "recept123",
        "name": "Sarah Johnson",
        "role": UserRole.RECEPTIONIST,
        "email": "sarah@atlas.local",
    },
    {
        "username": "labtech",
        "password": "lab123",
        "name": "Mike Chen",
        "role": UserRole.LAB_TECH,
        "email": "mike@atlas.local",
    },
    {
        "username": "labtech_plus",
        "password": "labplus123",
        "name": "Dr. Emily Rodriguez",
        "role": UserRole.LAB_TECH_PLUS,
        "email": "emily@atlas.local",
    },
]


def _normalize_rejection_criteria(raw_items: list) -> list[dict]:
    normalized: list[dict] = []
    for item in raw_items or []:
        if isinstance(item, dict):
            reason = str(item.get("reason") or item.get("label") or "").strip()
            domain = str(item.get("domain") or infer_criterion_domain(reason)).lower()
            if domain not in {"specimen", "analytical"}:
                domain = infer_criterion_domain(reason)
            normalized.append({"reason": reason, "domain": domain})
        else:
            reason = str(item).strip()
            normalized.append({"reason": reason, "domain": infer_criterion_domain(reason)})
    return normalized


def seed_users(db) -> None:
    print("Seeding users...")
    for user_data in SEED_USERS:
        existing = db.query(User).filter(User.username == user_data["username"]).first()
        if existing:
            continue
        user = User(
            username=user_data["username"],
            hashedPassword=get_password_hash(user_data["password"]),
            name=user_data["name"],
            role=user_data["role"],
            email=user_data["email"],
        )
        db.add(user)
        db.flush()
        print(f"  created user: {user_data['username']}")
    db.commit()


def seed_affiliation_pricing(db) -> None:
    print("Seeding affiliation pricing...")
    if db.query(AffiliationPricing).first():
        print("  affiliation pricing already exists")
        return
    for data in (
        {"duration": AffiliationDuration.SIX_MONTHS, "price": 29.99, "isActive": True},
        {"duration": AffiliationDuration.TWELVE_MONTHS, "price": 49.99, "isActive": True},
        {"duration": AffiliationDuration.TWENTY_FOUR_MONTHS, "price": 89.99, "isActive": True},
    ):
        db.add(AffiliationPricing(**data))
    db.commit()
    print("  created 3 affiliation pricing entries")


def seed_tests(db) -> None:
    print("Seeding tests from catalog...")
    data = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    created = 0
    for item in data.get("tests", []):
        test_data = {
            "code": item.get("test_code"),
            "name": item.get("display_name"),
            "displayName": item.get("display_name"),
            "synonyms": item.get("synonyms", []),
            "category": item.get("mapped_category"),
            "price": float(item.get("price", 0)),
            "turnaroundTimeHours": item.get("turnaround_time_hours", 24),
            "sampleType": item.get("mapped_sample_type"),
            "sampleVolume": item.get("sample_volume_description"),
            "minimumVolume": float(item.get("sample", {}).get("minimum_volume_ml", 0) or 0),
            "optimalVolume": None,
            "containerTypes": item.get("container_types", []),
            "containerTopColors": item.get("container_top_colors", []),
            "numberOfContainers": 1,
            "containerDescription": item.get("sample", {}).get("container"),
            "specialRequirements": None,
            "fastingRequired": item.get("sample", {}).get("fasting_required", False),
            "collectionNotes": item.get("sample", {}).get("collection_notes"),
            "rejectionCriteria": _normalize_rejection_criteria(
                item.get("sample", {}).get("rejection_criteria", [])
            ),
            "validationRejectionCriteria": _normalize_rejection_criteria(
                item.get("validation_rejection_criteria", [])
            ),
            "resultItems": item.get("result_items", []),
            "referenceRanges": [],
            "panels": item.get("panels", []),
            "loincCodes": item.get("loinc_codes", []),
            "methodology": item.get("method_common"),
            "confidence": item.get("confidence"),
            "notes": item.get("notes"),
            "isActive": True,
        }
        existing = db.query(Test).filter(Test.code == test_data["code"]).first()
        if existing:
            for key, value in test_data.items():
                setattr(existing, key, value)
        else:
            db.add(Test(**test_data))
        created += 1
    db.commit()
    print(f"  processed {created} tests")


def init_db() -> None:
    print("Initializing database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Tables created")

    db = SessionLocal()
    try:
        seed_users(db)
        seed_affiliation_pricing(db)
        seed_tests(db)
        print("Database initialization complete")
    except Exception as exc:
        print(f"Error during initialization: {exc}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
