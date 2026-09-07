"""
Generate test data from the test catalog JSON file
"""
import json
import os
import sys
from pathlib import Path

# Allow `poetry run python db_scripts/generate_tests.py` from backend/
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import engine
from app.models.test import Test
from app.utils.specimen_reasons import infer_criterion_domain


def _normalize_rejection_criteria(raw_items: list) -> list[dict]:
    """Store criteria with explicit domain for routing (specimen vs analytical)."""
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


def load_test_catalog():
    """Load the test catalog from the JSON file"""
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app', 'data', 'test-catalog.json')
    with open(file_path, 'r') as f:
        return json.load(f)


def _ensure_validation_rejection_column() -> None:
    with engine.connect() as conn:
        conn.execute(
            text(
                "ALTER TABLE tests ADD COLUMN IF NOT EXISTS validation_rejection_criteria JSON"
            )
        )
        conn.commit()


def generate_tests(db: Session):
    """Generate and insert tests into the database"""
    print("🧪 Generating tests from catalog...")
    _ensure_validation_rejection_column()
    
    try:
        data = load_test_catalog()
        tests_data = data.get('tests', [])
        
        tests_created = 0
        
        for item in tests_data:
            # Map JSON fields to Test model fields
            test_data = {
                "code": item.get("test_code"),
                "name": item.get("display_name"), # Using display_name for name as well
                "displayName": item.get("display_name"),
                "synonyms": item.get("synonyms", []),
                "category": item.get("mapped_category"),
                
                # Pricing and timing
                "price": float(item.get("price", 0)),
                "turnaroundTimeHours": item.get("turnaround_time_hours", 24),
                
                # Sample requirements
                "sampleType": item.get("mapped_sample_type"),
                "sampleVolume": item.get("sample_volume_description"),
                "minimumVolume": float(item.get("sample", {}).get("minimum_volume_ml", 0) or 0),
                "optimalVolume": None, # Not explicitly in JSON, usually related to min volume
                
                # Container requirements
                "containerTypes": item.get("container_types", []),
                "containerTopColors": item.get("container_top_colors", []),
                "numberOfContainers": 1, # Default
                "containerDescription": item.get("sample", {}).get("container"),
                
                # Special requirements
                "specialRequirements": None, # Could be mapped if available
                "fastingRequired": item.get("sample", {}).get("fasting_required", False),
                "collectionNotes": item.get("sample", {}).get("collection_notes"),
                "rejectionCriteria": _normalize_rejection_criteria(
                    item.get("sample", {}).get("rejection_criteria", [])
                ),
                "validationRejectionCriteria": _normalize_rejection_criteria(
                    item.get("validation_rejection_criteria", [])
                ),
                
                # Reference ranges and parameters
                # The model has referenceRanges (JSON) and resultItems (JSON). 
                # The JSON catalog has result_items which contains reference_range.
                # We can store result_items directly or transform them.
                "resultItems": item.get("result_items", []),
                "referenceRanges": [], # We'll keep this empty or extract if needed, but resultItems has it.
                
                # Additional catalog fields
                "panels": item.get("panels", []),
                "loincCodes": item.get("loinc_codes", []),
                "methodology": item.get("method_common"),
                "confidence": item.get("confidence"),
                "notes": item.get("notes"),
                
                "isActive": True
            }
            
            # Check if test exists
            existing = db.query(Test).filter(Test.code == test_data["code"]).first()
            if existing:
                # Update existing
                for key, value in test_data.items():
                    setattr(existing, key, value)
            else:
                # Create new
                test = Test(**test_data)
                db.add(test)
            
            tests_created += 1
            
        db.commit()
        print(f"✅ Successfully processed {tests_created} tests from catalog!")
        
    except Exception as e:
        print(f"\n❌ Error generating tests: {e}")
        db.rollback()
        raise


if __name__ == "__main__":
    from app.database import SessionLocal
    from app.core.cache import invalidate_tests_cache

    db = SessionLocal()
    try:
        generate_tests(db)
        invalidate_tests_cache()
        print("✓ Test catalog cache invalidated")
    finally:
        db.close()
